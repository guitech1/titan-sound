/**
 * FluxPay integration service for TITAN SOUND.
 *
 * Based on analysis of guitech1/fluxpay:
 * - Auth: Authorization: Bearer sk_test_... | sk_live_...
 * - Amounts in cents (integer)
 * - Create PIX: POST /v1/payments with payment_method: { type: "pix" }
 * - Response includes pix_copy_paste, pix_qr_code_base64, status
 * - Webhooks: FluxPay-Signature: t=<timestamp>,v1=<hmac-sha256>
 * - Events: payment.succeeded, payment.pending, payment.failed, etc.
 * - Idempotency via Idempotency-Key header
 *
 * NEVER expose secret keys to the browser.
 * All calls must go through Next.js API routes (server-side).
 */

export type FluxPayEnvironment = "test" | "live";

export interface FluxPayPayment {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "succeeded" | "failed" | "canceled" | "refunded";
  description?: string;
  pix_copy_paste?: string | null;
  pix_qr_code_base64?: string | null;
  expires_at?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface CreatePixPaymentInput {
  amountCents: number;
  description: string;
  orderId: string;
  customerEmail?: string;
  customerName?: string;
  expiresInSeconds?: number;
  idempotencyKey: string;
}

function getConfig() {
  const apiUrl = process.env.FLUXPAY_API_URL || process.env.NEXT_PUBLIC_FLUXPAY_API_URL;
  const secretKey = process.env.FLUXPAY_SECRET_KEY;
  if (!apiUrl || !secretKey) {
    throw new Error(
      "FluxPay nao configurado. Defina FLUXPAY_API_URL e FLUXPAY_SECRET_KEY no ambiente."
    );
  }
  return { apiUrl: apiUrl.replace(/\/$/, ""), secretKey };
}

export async function createPixPayment(
  input: CreatePixPaymentInput
): Promise<FluxPayPayment> {
  const { apiUrl, secretKey } = getConfig();

  const body = {
    amount: input.amountCents,
    currency: "brl",
    description: input.description,
    payment_method: { type: "pix" },
    expires_in_seconds: input.expiresInSeconds ?? 3600,
    metadata: {
      order_id: input.orderId,
      customer_email: input.customerEmail,
      customer_name: input.customerName,
    },
    idempotency_key: input.idempotencyKey,
  };

  const res = await fetch(`${apiUrl}/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || err?.message || `FluxPay error ${res.status}`
    );
  }

  const json = await res.json();
  return json.data as FluxPayPayment;
}

export async function getPayment(paymentId: string): Promise<FluxPayPayment> {
  const { apiUrl, secretKey } = getConfig();

  const res = await fetch(`${apiUrl}/v1/payments/${paymentId}`, {
    headers: {
      Authorization: `Bearer ${secretKey}`,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `FluxPay getPayment ${res.status}`);
  }

  const json = await res.json();
  return json.data as FluxPayPayment;
}

export function verifyFluxPaySignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string
): boolean {
  if (!signatureHeader || !webhookSecret) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v?.trim() ?? ""];
    })
  );

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false;

  const crypto = require("crypto") as typeof import("crypto");
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}
