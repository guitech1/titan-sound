import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPixPayment } from "@/services/fluxpay";
import { randomUUID } from "crypto";

/**
 * Creates order + items + payment, then FluxPay PIX charge.
 * Prices and stock are loaded from the database (not trusted from the client).
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const {
      items,
      address,
      customer_email,
      customer_name,
      customer_note,
      coupon_code,
    } = body as {
      items: { product_id: string; quantity: number }[];
      address?: Record<string, unknown>;
      customer_email?: string;
      customer_name?: string;
      customer_note?: string;
      coupon_code?: string;
    };

    if (!items?.length) {
      return NextResponse.json({ message: "Carrinho vazio." }, { status: 400 });
    }

    const productIds = [...new Set(items.map((i) => i.product_id))];
    const { data: products, error: prodErr } = await supabase
      .from("products")
      .select(
        "id, name, sku, price, stock_quantity, is_active, product_images(image_url, sort_order)"
      )
      .in("id", productIds)
      .eq("is_active", true);

    if (prodErr || !products?.length) {
      return NextResponse.json(
        { message: "Produtos inválidos ou indisponíveis.", detail: prodErr?.message },
        { status: 400 }
      );
    }

    const byId = new Map(products.map((p) => [p.id, p]));

    const resolved: {
      product_id: string;
      quantity: number;
      unit_price: number;
      product_name: string;
      product_sku: string | null;
      product_image_url: string | null;
      line_total: number;
    }[] = [];

    for (const item of items) {
      const qty = Math.max(1, Math.floor(Number(item.quantity) || 0));
      const product = byId.get(item.product_id);
      if (!product || qty < 1) {
        return NextResponse.json(
          { message: `Produto indisponível: ${item.product_id}` },
          { status: 400 }
        );
      }
      const stock = Number(product.stock_quantity ?? 0);
      if (stock < qty) {
        return NextResponse.json(
          { message: `Estoque insuficiente para ${product.name}.` },
          { status: 400 }
        );
      }
      const unit_price = Number(product.price);
      const images = (product.product_images as { image_url: string; sort_order?: number }[]) || [];
      images.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      resolved.push({
        product_id: product.id,
        quantity: qty,
        unit_price,
        product_name: product.name,
        product_sku: product.sku || null,
        product_image_url: images[0]?.image_url || null,
        line_total: unit_price * qty,
      });
    }

    const subtotal = resolved.reduce((s, i) => s + i.line_total, 0);
    let discount_total = 0;
    let coupon_id: string | null = null;
    let applied_coupon: string | null = null;

    if (coupon_code && typeof coupon_code === "string") {
      const code = coupon_code.trim().toUpperCase();
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (coupon) {
        const now = new Date();
        const validFrom = coupon.valid_from ? new Date(coupon.valid_from as string) : null;
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until as string) : null;
        const minOrder = Number(coupon.min_order_amount ?? 0);
        const used = Number(coupon.used_count ?? 0);
        const maxUses = coupon.max_uses != null ? Number(coupon.max_uses) : null;

        const inWindow =
          (!validFrom || validFrom <= now) && (!validUntil || validUntil >= now);
        const underLimit = maxUses == null || used < maxUses;

        if (inWindow && underLimit && subtotal >= minOrder) {
          if (coupon.discount_type === "percent") {
            discount_total = (subtotal * Number(coupon.discount_value)) / 100;
          } else {
            discount_total = Number(coupon.discount_value);
          }
          if (discount_total > subtotal) discount_total = subtotal;
          coupon_id = coupon.id as string;
          applied_coupon = coupon.code as string;
        }
      }
    }

    const shipping_total = subtotal - discount_total >= 299 ? 0 : 25;
    const total = Math.max(0, subtotal - discount_total + shipping_total);
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
        coupon_id,
        coupon_code: applied_coupon,
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

    const orderItems = resolved.map((i) => ({
      order_id: order.id,
      product_id: i.product_id,
      product_name: i.product_name,
      product_sku: i.product_sku,
      product_image_url: i.product_image_url,
      quantity: i.quantity,
      unit_price: i.unit_price,
      line_total: i.line_total,
    }));

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
          order_number: order.order_number,
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
      subtotal,
      discount_total,
      shipping_total,
      coupon_code: applied_coupon,
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
