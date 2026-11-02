import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createPixPayment } from "@/services/fluxpay";
import { randomUUID } from "crypto";
import { isValidCpf, stripCpf } from "@/lib/cpf";
import { hashCpf } from "@/lib/hash";
import {
  getInstallmentAmounts,
  calculateInstallments,
  type InstallmentOption,
} from "@/lib/installments";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada no servidor");
  }
  return createServiceClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseBirthDate(value: string): string | null {
  // Aceita DD/MM/AAAA ou YYYY-MM-DD
  const v = (value || "").trim();
  let y: number, m: number, d: number;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) {
    const [dd, mm, yyyy] = v.split("/").map(Number);
    d = dd; m = mm; y = yyyy;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    const [yyyy, mm, dd] = v.split("-").map(Number);
    d = dd; m = mm; y = yyyy;
  } else {
    return null;
  }
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  const now = new Date();
  if (date > now) return null;
  // Idade mínima razoável (16 anos)
  const min = new Date();
  min.setFullYear(min.getFullYear() - 16);
  if (date > min) return null;
  return `${y.toString().padStart(4, "0")}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
}

/**
 * Cria pedido + (opcionalmente) parcelas internas + cobrança PIX via FluxPay.
 * payment_method: "pix" | "pix_installment"
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { message: "Faça login para finalizar a compra.", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      items,
      address,
      customer_email,
      customer_name,
      customer_note,
      coupon_code,
      payment_method = "pix",
      installment_count,
      buyer_cpf,
      buyer_full_name,
      buyer_birth_date,
    } = body as {
      items: { product_id: string; quantity: number }[];
      address?: Record<string, unknown>;
      customer_email?: string;
      customer_name?: string;
      customer_note?: string;
      coupon_code?: string;
      payment_method?: "pix" | "pix_installment";
      installment_count?: number;
      buyer_cpf?: string;
      buyer_full_name?: string;
      buyer_birth_date?: string;
    };

    if (!items?.length) {
      return NextResponse.json({ message: "Carrinho vazio." }, { status: 400 });
    }

    const isInstallment = payment_method === "pix_installment";

    if (isInstallment) {
      const count = Number(installment_count);
      if (![2, 3, 4].includes(count)) {
        return NextResponse.json(
          { message: "Parcelamento disponível apenas em 2x, 3x ou 4x." },
          { status: 400 }
        );
      }
      if (!buyer_cpf || !isValidCpf(buyer_cpf)) {
        return NextResponse.json({ message: "CPF inválido." }, { status: 400 });
      }
      const fullName = (buyer_full_name || "").trim().replace(/\s+/g, " ");
      if (!fullName || fullName.split(" ").length < 2) {
        return NextResponse.json(
          { message: "Informe nome e sobrenome completos." },
          { status: 400 }
        );
      }
      const birth = parseBirthDate(buyer_birth_date || "");
      if (!birth) {
        return NextResponse.json(
          { message: "Data de nascimento inválida." },
          { status: 400 }
        );
      }
    }

    let admin;
    try {
      admin = getAdminClient();
    } catch (e) {
      console.error("[payments/create]", e);
      return NextResponse.json(
        { message: "Servidor sem configuração de banco (service role)." },
        { status: 503 }
      );
    }

    const productIds = [...new Set(items.map((i) => i.product_id))];
    const { data: products, error: prodErr } = await admin
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
        return NextResponse.json({ message: `Produto indisponível.` }, { status: 400 });
      }
      const stock = Number(product.stock_quantity ?? 0);
      if (stock < qty) {
        return NextResponse.json(
          { message: `Estoque insuficiente para ${product.name}.` },
          { status: 400 }
        );
      }
      const unit_price = Number(product.price);
      const images =
        (product.product_images as { image_url: string; sort_order?: number }[]) || [];
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
      const { data: coupon } = await admin
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

    if (total < 0.01) {
      return NextResponse.json({ message: "Valor inválido." }, { status: 400 });
    }

    const order_number = `TS-${Date.now().toString(36).toUpperCase()}`;

    // --- Dados do comprador (parcelado) ---
    let buyerCpfHash: string | null = null;
    let buyerFullName: string | null = null;
    let buyerBirth: string | null = null;
    let instCount: number | null = null;
    let interestRate = 0;

    if (isInstallment) {
      buyerCpfHash = hashCpf(buyer_cpf!);
      buyerFullName = (buyer_full_name || "").trim().replace(/\s+/g, " ");
      buyerBirth = parseBirthDate(buyer_birth_date || "");
      instCount = Number(installment_count) as InstallmentOption;
      interestRate = 0; // configurável no futuro
    }

    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        order_number,
        user_id: user.id,
        status: "awaiting_payment",
        payment_status: "pending",
        payment_method: isInstallment ? "pix_installment" : "pix",
        installment_count: instCount,
        buyer_cpf_hash: buyerCpfHash,
        buyer_full_name: buyerFullName,
        buyer_birth_date: buyerBirth,
        interest_rate: interestRate,
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

    const { error: itemsErr } = await admin.from("order_items").insert(orderItems);
    if (itemsErr) {
      console.error("[payments/create] items", itemsErr);
      return NextResponse.json(
        { message: "Erro ao salvar itens do pedido.", detail: itemsErr.message },
        { status: 500 }
      );
    }

    // ========== PIX À VISTA (fluxo original) ==========
    if (!isInstallment) {
      const amount_cents = Math.round(total * 100);
      const idempotencyKey = `order-${order.id}-${randomUUID()}`;
      let pix;
      try {
        pix = await createPixPayment({
          amountCents: amount_cents,
          description: `Pedido ${order.order_number} — TITAN SOUND`,
          orderId: order.id,
          customerEmail: customer_email || user.email || undefined,
          customerName: customer_name || undefined,
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

      await admin.from("payments").insert({
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
        payment_method: "pix",
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
    }

    // ========== PIX PARCELADO (sistema interno) ==========
    const count = instCount as InstallmentOption;
    const amounts = getInstallmentAmounts(total, count, interestRate);
    const preview = calculateInstallments(total, count, interestRate);

    // Cria registros de todas as parcelas
    const installmentRows = amounts.map((amount, idx) => ({
      order_id: order.id,
      installment_number: idx + 1,
      amount,
      due_date: preview.dueDates[idx],
      status: "pending" as const,
    }));

    const { data: createdInstallments, error: instErr } = await admin
      .from("installments")
      .insert(installmentRows)
      .select("id, installment_number, amount, due_date, status");

    if (instErr || !createdInstallments?.length) {
      console.error("[payments/create] installments", instErr);
      return NextResponse.json(
        {
          message:
            "Pedido criado, mas falha ao registrar parcelas. Execute o schema PIX_PARCELADO_SCHEMA.sql no Supabase.",
          order_id: order.id,
          order_number: order.order_number,
          detail: instErr?.message,
        },
        { status: 500 }
      );
    }

    // Gera PIX apenas da 1ª parcela via FluxPay
    const first = createdInstallments.find((i) => i.installment_number === 1)!;
    const amountCents = Math.round(Number(first.amount) * 100);
    const idempotencyKey = `inst-${first.id}-${randomUUID()}`;

    let pix;
    try {
      pix = await createPixPayment({
        amountCents,
        description: `Parcela 1/${count} — Pedido ${order.order_number} — TITAN SOUND`,
        orderId: order.id,
        customerEmail: customer_email || user.email || undefined,
        customerName: buyerFullName || customer_name || undefined,
        idempotencyKey,
      });
    } catch (e) {
      return NextResponse.json(
        {
          message: "Parcelas registradas, mas falha ao gerar PIX da 1ª parcela.",
          order_id: order.id,
          order_number: order.order_number,
          installments: createdInstallments,
          detail: e instanceof Error ? e.message : String(e),
        },
        { status: 502 }
      );
    }

    // Salva payment e vincula à 1ª parcela
    const { data: paymentRow } = await admin
      .from("payments")
      .insert({
        order_id: order.id,
        provider: "fluxpay",
        provider_payment_id: pix.id,
        idempotency_key: idempotencyKey,
        amount: first.amount,
        status: pix.status || "pending",
        pix_copy_paste: pix.pix_copy_paste || null,
        pix_qr_code_base64: pix.pix_qr_code_base64 || null,
        expires_at: pix.expires_at || null,
        provider_metadata: {
          ...(pix as unknown as Record<string, unknown>),
          installment_id: first.id,
          installment_number: 1,
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
      .eq("id", first.id);

    return NextResponse.json({
      payment_method: "pix_installment",
      order_id: order.id,
      order_number: order.order_number,
      amount: total,
      installment_count: count,
      interest_rate: interestRate,
      installments: createdInstallments.map((i) => ({
        id: i.id,
        number: i.installment_number,
        amount: i.amount,
        due_date: i.due_date,
        status: i.status,
      })),
      // PIX da 1ª parcela
      first_installment: {
        id: first.id,
        number: 1,
        amount: first.amount,
        due_date: first.due_date,
        pix_copy_paste: pix.pix_copy_paste,
        pix_qr_code_base64: pix.pix_qr_code_base64,
        payment_id: pix.id,
      },
      status: pix.status,
    });
  } catch (e) {
    console.error("[payments/create]", e);
    return NextResponse.json({ message: "Erro interno." }, { status: 500 });
  }
}
