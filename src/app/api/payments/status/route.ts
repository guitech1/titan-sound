import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { getPayment } from "@/services/fluxpay";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada");
  }
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * GET /api/payments/status?order_id=...
 * Retorna status do pedido/pagamento. Se ainda pendente, tenta reconciliar
 * consultando a FluxPay (fallback caso o webhook não tenha chegado).
 */
export async function GET(req: NextRequest) {
  try {
    const orderId = req.nextUrl.searchParams.get("order_id");
    if (!orderId) {
      return NextResponse.json({ message: "order_id obrigatório" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    let admin;
    try {
      admin = getAdminClient();
    } catch {
      return NextResponse.json({ message: "Servidor sem service role" }, { status: 503 });
    }

    const { data: order, error: orderErr } = await admin
      .from("orders")
      .select("id, order_number, status, payment_status, payment_method, user_id")
      .eq("id", orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ message: "Pedido não encontrado" }, { status: 404 });
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ message: "Sem permissão" }, { status: 403 });
    }

    // Já pago → responde direto
    if (
      order.payment_status === "paid" ||
      order.status === "paid" ||
      order.payment_status === "partial"
    ) {
      return NextResponse.json({
        order_id: order.id,
        order_number: order.order_number,
        status: order.status,
        payment_status: order.payment_status,
        paid: true,
      });
    }

    // Ainda pendente: tenta reconciliar com FluxPay
    const { data: payment } = await admin
      .from("payments")
      .select("id, provider_payment_id, status")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (payment?.provider_payment_id && payment.status !== "succeeded") {
      try {
        const remote = await getPayment(payment.provider_payment_id);
        if (remote.status === "succeeded") {
          const now = new Date().toISOString();

          await admin
            .from("payments")
            .update({ status: "succeeded", updated_at: now })
            .eq("id", payment.id)
            .neq("status", "succeeded");

          if (order.payment_method === "pix_installment") {
            // Marca parcela vinculada
            await admin
              .from("installments")
              .update({
                status: "paid",
                paid_at: now,
                updated_at: now,
              })
              .eq("payment_id", payment.id)
              .neq("status", "paid");

            // Se não achou por payment_id, tenta por provider_payment_id
            await admin
              .from("installments")
              .update({
                status: "paid",
                paid_at: now,
                updated_at: now,
              })
              .eq("provider_payment_id", payment.provider_payment_id)
              .neq("status", "paid");

            const { data: remaining } = await admin
              .from("installments")
              .select("id")
              .eq("order_id", orderId)
              .neq("status", "paid")
              .limit(1);

            if (!remaining?.length) {
              await admin
                .from("orders")
                .update({
                  status: "paid",
                  payment_status: "paid",
                  updated_at: now,
                })
                .eq("id", orderId);
            } else {
              await admin
                .from("orders")
                .update({
                  payment_status: "partial",
                  updated_at: now,
                })
                .eq("id", orderId);
            }
          } else {
            await admin
              .from("orders")
              .update({
                status: "paid",
                payment_status: "paid",
                updated_at: now,
              })
              .eq("id", orderId);
          }

          return NextResponse.json({
            order_id: order.id,
            order_number: order.order_number,
            status: "paid",
            payment_status: order.payment_method === "pix_installment" ? "partial" : "paid",
            paid: true,
            reconciled: true,
          });
        }
      } catch (e) {
        console.error("[payments/status] reconcile", e);
        // Continua e devolve status atual
      }
    }

    return NextResponse.json({
      order_id: order.id,
      order_number: order.order_number,
      status: order.status,
      payment_status: order.payment_status,
      paid: false,
    });
  } catch (e) {
    console.error("[payments/status]", e);
    return NextResponse.json({ message: "Erro interno" }, { status: 500 });
  }
}
