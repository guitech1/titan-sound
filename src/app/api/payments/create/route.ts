import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPixPayment } from "@/services/fluxpay";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const { items, address, customer_email, customer_name, customer_note } = body;

    if (!items?.length) {
      return NextResponse.json({ message: "Carrinho vazio." }, { status: 400 });
    }

    const subtotal = items.reduce(
      (s: number, i: { unit_price: number; quantity: number }) =>
        s + Number(i.unit_price) * Number(i.quantity),
      0
    );
    const shipping_total = subtotal >= 299 ? 0 : 25;
    const discount_total = 0;
    const total = subtotal + shipping_total - discount_total;
    const amount_cents = Math.round(total * 100);

    if (amount_cents < 1) {
      return NextResponse.json({ message: "Valor inválido." }, { status: 400 });
    }

    const order_number = `TS-${Date.now().toString(36).toUpperCase()}`;

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .insert({
        order_number,
        user_id: user?.id ?? null,
        status: "pending",
        payment_status: "pending",
        subtotal,
        discount_total,
        shipping_total,
        total,
        shipping_address: address || {},
        customer_note: customer_note || null,
      })
      .select("id, order_number")
      .single();

    if (orderErr || !order) {
      console.error("[payments/create] order", orderErr);
      return NextResponse.json(
        { message: "Não foi possível criar o pedido.", detail: orderErr?.message },
        { status: 500 }
      );
    }

    const orderItems = items.map(
      (i: {
        product_id: string;
        quantity: number;
        unit_price: number;
        product_name?: string;
        product_sku?: string;
        product_image?: string;
      }) => ({
        order_id: order.id,
        product_id: i.product_id,
        product_name: i.product_name || "Produto",
        product_sku: i.product_sku || null,
        product_image_url: i.product_image || null,
        quantity: i.quantity,
        unit_price: i.unit_price,
        line_total: Number(i.unit_price) * Number(i.quantity),
      })
    );

    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
    if (itemsErr) {
      return NextResponse.json(
        { message: "Erro ao salvar itens.", detail: itemsErr.message },
        { status: 500 }
      );
    }

    const idempotencyKey = `order-${order.id}-${randomUUID()}`;
    let pix;
    try {
      pix = await createPixPayment({
        amountCents: amount_cents,
        description: `Pedido ${order.order_number} — TITAN SOUND`,
        orderId: order.id,
        customerEmail: customer_email,
        customerName: customer_name,
        idempotencyKey,
      });
    } catch (e) {
      return NextResponse.json(
        {
          message: "Pedido criado, mas falha ao gerar PIX.",
          order_id: order.id,
          detail: e instanceof Error ? e.message : String(e),
        },
        { status: 502 }
      );
    }

    await supabase.from("payments").insert({
      order_id: order.id,
      provider: "fluxpay",
      provider_payment_id: pix.id,
      idempotency_key: idempotencyKey,
      amount: total,
      status: pix.status || "pending",
      pix_copy_paste: pix.pix_copy_paste || null,
      pix_qr_code_base64: pix.pix_qr_code_base64 || null,
      expires_at: pix.expires_at || null,
      provider_metadata: pix as unknown as Record<string, unknown>,
    });

    return NextResponse.json({
      order_id: order.id,
      order_number: order.order_number,
      amount: total,
      pix_copy_paste: pix.pix_copy_paste,
      pix_qr_code_base64: pix.pix_qr_code_base64,
      payment_id: pix.id,
      status: pix.status,
    });
  } catch (e) {
    console.error("[payments/create]", e);
    return NextResponse.json({ message: "Erro interno." }, { status: 500 });
  }
}
