import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createPixPayment } from "@/services/fluxpay";
import { randomUUID } from "crypto";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Service role missing");
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Gera (ou regenera) o PIX de uma parcela específica.
 * Só permite se a parcela estiver pending e pertencer ao usuário autenticado.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: installmentId } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
    }

    const admin = getAdminClient();

    const { data: inst, error } = await admin
      .from("installments")
      .select(
        "id, order_id, installment_number, amount, status, provider_payment_id, pix_copy_paste, pix_qr_code_base64, orders!inner(id, order_number, user_id, installment_count)"
      )
      .eq("id", installmentId)
      .maybeSingle();

    if (error || !inst) {
      return NextResponse.json({ message: "Parcela não encontrada." }, { status: 404 });
    }

    const order = inst.orders as unknown as {
      id: string;
      order_number: string;
      user_id: string;
      installment_count: number;
    };

    if (order.user_id !== user.id) {
      return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
    }

    if (inst.status === "paid") {
      return NextResponse.json({ message: "Parcela já paga." }, { status: 400 });
    }

    // Se já existe PIX válido, devolve o existente
    if (inst.pix_copy_paste && inst.provider_payment_id) {
      return NextResponse.json({
        installment_id: inst.id,
        number: inst.installment_number,
        amount: inst.amount,
        pix_copy_paste: inst.pix_copy_paste,
        pix_qr_code_base64: inst.pix_qr_code_base64,
        payment_id: inst.provider_payment_id,
        reused: true,
      });
    }

    const amountCents = Math.round(Number(inst.amount) * 100);
    const idempotencyKey = `inst-${inst.id}-${randomUUID()}`;
    const totalParcels = order.installment_count || 4;

    const pix = await createPixPayment({
      amountCents,
      description: `Parcela ${inst.installment_number}/${totalParcels} — Pedido ${order.order_number} — TITAN SOUND`,
      orderId: order.id,
      customerEmail: user.email || undefined,
      idempotencyKey,
    });

    const { data: paymentRow } = await admin
      .from("payments")
      .insert({
        order_id: order.id,
        provider: "fluxpay",
        provider_payment_id: pix.id,
        idempotency_key: idempotencyKey,
        amount: inst.amount,
        status: pix.status || "pending",
        pix_copy_paste: pix.pix_copy_paste || null,
        pix_qr_code_base64: pix.pix_qr_code_base64 || null,
        expires_at: pix.expires_at || null,
        provider_metadata: {
          installment_id: inst.id,
          installment_number: inst.installment_number,
        },
      })
      .select("id")
      .single();

    await admin
      .from("installments")
      .update({
        payment_id: paymentRow?.id ?? null,
        provider_payment_id: pix.id,
        pix_copy_paste: pix.pix_copy_paste || null,
        pix_qr_code_base64: pix.pix_qr_code_base64 || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inst.id);

    return NextResponse.json({
      installment_id: inst.id,
      number: inst.installment_number,
      amount: inst.amount,
      pix_copy_paste: pix.pix_copy_paste,
      pix_qr_code_base64: pix.pix_qr_code_base64,
      payment_id: pix.id,
      reused: false,
    });
  } catch (e) {
    console.error("[installments/pix]", e);
    return NextResponse.json(
      { message: e instanceof Error ? e.message : "Erro interno." },
      { status: 500 }
    );
  }
}
