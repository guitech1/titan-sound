import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { verifyFluxPaySignature } from "@/services/fluxpay";

function getServiceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL missing");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function markPaid(
  supabase: SupabaseClient,
  paymentId: string,
  orderId: string
) {
  const now = new Date().toISOString();

  const { error: payErr } = await supabase
    .from("payments")
    .update({ status: "succeeded", updated_at: now } as Record<string, string>)
    .eq("id", paymentId)
    .neq("status", "succeeded");

  if (payErr) {
    console.error("[webhook/fluxpay] payment update", payErr);
    throw payErr;
  }

  const { error: orderErr } = await supabase
    .from("orders")
    .update({
      status: "paid",
      payment_status: "paid",
      updated_at: now,
    } as Record<string, string>)
    .eq("id", orderId);

  if (orderErr) {
    console.error("[webhook/fluxpay] order update", orderErr);
    throw orderErr;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature =
    req.headers.get("fluxpay-signature") || req.headers.get("FluxPay-Signature");
  const secret = process.env.FLUXPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[webhook/fluxpay] FLUXPAY_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  if (!verifyFluxPaySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: {
    type?: string;
    data?: {
      id?: string;
      status?: string;
      metadata?: { order_id?: string };
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const eventType = payload.type;
  const providerPaymentId = payload.data?.id;
  const orderIdFromMeta = payload.data?.metadata?.order_id;

  if (eventType !== "payment.succeeded" || !providerPaymentId) {
    return NextResponse.json({ received: true, ignored: true });
  }

  let supabase: SupabaseClient;
  try {
    supabase = getServiceClient();
  } catch (e) {
    console.error("[webhook/fluxpay]", e);
    return NextResponse.json({ error: "server_misconfigured" }, { status: 503 });
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("id, order_id, status")
    .eq("provider_payment_id", providerPaymentId)
    .maybeSingle();

  let target = payment as { id: string; order_id: string; status: string } | null;

  if (!target && orderIdFromMeta) {
    const { data: byOrder } = await supabase
      .from("payments")
      .select("id, order_id, status")
      .eq("order_id", orderIdFromMeta)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    target = byOrder as { id: string; order_id: string; status: string } | null;
  }

  if (!target) {
    return NextResponse.json({ received: true, matched: false });
  }

  if (target.status === "succeeded") {
    return NextResponse.json({
      received: true,
      duplicate: true,
      order_id: target.order_id,
    });
  }

  try {
    await markPaid(supabase, target.id, target.order_id);
  } catch {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true, order_id: target.order_id });
}
