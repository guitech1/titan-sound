-- ============================================================
-- TITAN SOUND — PIX PARCELADO (sistema interno)
-- Execute este script no SQL Editor do Supabase.
-- ============================================================

-- 1. Estende a tabela orders com campos de parcelamento
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'pix'
    CHECK (payment_method IN ('pix', 'pix_installment')),
  ADD COLUMN IF NOT EXISTS installment_count integer,
  ADD COLUMN IF NOT EXISTS buyer_cpf_hash text,          -- hash do CPF (nunca o CPF em claro)
  ADD COLUMN IF NOT EXISTS buyer_full_name text,
  ADD COLUMN IF NOT EXISTS buyer_birth_date date,
  ADD COLUMN IF NOT EXISTS interest_rate numeric(5,4) DEFAULT 0;  -- taxa mensal (ex: 0.0199 = 1,99%)

COMMENT ON COLUMN orders.buyer_cpf_hash IS 'SHA-256 do CPF (apenas para busca restrita e LGPD)';
COMMENT ON COLUMN orders.payment_method IS 'pix = à vista | pix_installment = parcelado interno';

-- 2. Tabela de parcelas individuais
CREATE TABLE IF NOT EXISTS installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  installment_number integer NOT NULL CHECK (installment_number >= 1 AND installment_number <= 4),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'overdue', 'canceled')),
  payment_id uuid REFERENCES payments(id) ON DELETE SET NULL,
  provider_payment_id text,                 -- id na FluxPay
  pix_copy_paste text,
  pix_qr_code_base64 text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, installment_number)
);

CREATE INDEX IF NOT EXISTS idx_installments_order ON installments(order_id);
CREATE INDEX IF NOT EXISTS idx_installments_status ON installments(status);
CREATE INDEX IF NOT EXISTS idx_installments_due ON installments(due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_installments_provider ON installments(provider_payment_id);

-- 3. RLS básica (ajuste conforme suas policies existentes)
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;

-- Cliente só vê as próprias parcelas (via order.user_id)
CREATE POLICY "installments_select_own"
  ON installments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = installments.order_id
        AND o.user_id = auth.uid()
    )
  );

-- Service role e admin (via is_admin se existir) têm acesso total via service key
-- As operações de escrita de parcelas ficam no backend (service role).

-- 4. Função auxiliar para marcar parcela paga (usada pelo webhook)
CREATE OR REPLACE FUNCTION mark_installment_paid(
  p_provider_payment_id text,
  p_paid_at timestamptz DEFAULT now()
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_installment_id uuid;
  v_order_id uuid;
  v_all_paid boolean;
BEGIN
  UPDATE installments
  SET status = 'paid',
      paid_at = p_paid_at,
      updated_at = now()
  WHERE provider_payment_id = p_provider_payment_id
    AND status <> 'paid'
  RETURNING id, order_id INTO v_installment_id, v_order_id;

  IF v_installment_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Se todas as parcelas do pedido estiverem pagas, marca o pedido como pago
  SELECT NOT EXISTS (
    SELECT 1 FROM installments
    WHERE order_id = v_order_id AND status <> 'paid'
  ) INTO v_all_paid;

  IF v_all_paid THEN
    UPDATE orders
    SET status = 'paid',
        payment_status = 'paid',
        updated_at = now()
    WHERE id = v_order_id;
  ELSE
    -- Pedido parcialmente pago
    UPDATE orders
    SET payment_status = 'partial',
        updated_at = now()
    WHERE id = v_order_id;
  END IF;

  RETURN v_installment_id;
END;
$$;
