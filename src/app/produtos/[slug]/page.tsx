import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { AddToCartButton } from "@/components/product/AddToCartButton";
import {
  calculateShipping,
  FREE_SHIPPING_THRESHOLD,
  FIXED_SHIPPING_COST,
} from "@/lib/shipping";
import { calculateInstallments } from "@/lib/installments";
import {
  Truck, Shield, Package, CreditCard, MessageCircle, CheckCircle2, AlertCircle, Clock,
} from "lucide-react";
import { ProductShippingCep } from "@/components/product/ProductShippingCep";
import { ProductGallery } from "@/components/product/ProductGallery";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("name, short_description, product_images(image_url, sort_order)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!product) return { title: "Produto | Titan Sound" };
  const images = ((product.product_images || []) as { image_url: string; sort_order?: number }[])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const image = images[0]?.image_url;
  return {
    title: `${product.name} | Titan Sound`,
    description: product.short_description || `Compre ${product.name} na Titan Sound — som automotivo de alta performance.`,
    openGraph: {
      title: product.name,
      description: product.short_description || undefined,
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*, product_images(id, image_url, alt_text, sort_order)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (!product) notFound();

  const price = Number(product.price);
  const compare = product.compare_at_price != null ? Number(product.compare_at_price) : null;
  const images = ((product.product_images || []) as {
    id: string; image_url: string; alt_text?: string; sort_order?: number;
  }[]).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const mainImage = images[0]?.image_url;
  const stock = product.stock_quantity ?? 0;
  const inStock = stock > 0;
  const lowStock = inStock && stock <= 5;
  const shippingQuote = calculateShipping(price);

  let installmentPreview: { count: number; installmentAmount: number; total: number }[] = [];
  try {
    const baseForInstallment = price + shippingQuote.cost;
    for (const count of [2, 3, 4] as const) {
      const prev = calculateInstallments(baseForInstallment, count, 0);
      installmentPreview.push({
        count,
        installmentAmount: prev.installmentAmount,
        total: prev.totalWithInterest,
      });
    }
  } catch {
    installmentPreview = [];
  }

  const specs: { label: string; value: string }[] = [];
  if (product.sku) specs.push({ label: "SKU", value: product.sku });
  if (product.brand) specs.push({ label: "Marca", value: String(product.brand) });
  if (product.model) specs.push({ label: "Modelo", value: String(product.model) });
  if (product.specs && typeof product.specs === "object") {
    Object.entries(product.specs as Record<string, unknown>).forEach(([k, v]) => {
      if (v != null && String(v).trim()) specs.push({ label: k, value: String(v) });
    });
  }

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "573502625621";
  const whatsappMsg = encodeURIComponent(
    `Olá! Tenho dúvida sobre o produto: ${product.name}${product.sku ? ` (SKU ${product.sku})` : ""}`
  );

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-primary">Início</Link>
        <span className="mx-2">/</span>
        <Link href="/produtos" className="hover:text-primary">Produtos</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={images} productName={product.name} mainImage={mainImage} />

        <div className="space-y-6">
          {product.sku && (
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              SKU {product.sku}
            </p>
          )}
          <h1 className="text-2xl font-bold leading-tight md:text-3xl">{product.name}</h1>

          <div className="rounded-2xl border border-border bg-card/50 p-5">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl font-bold text-primary">{formatCurrency(price)}</span>
              {compare != null && compare > price && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatCurrency(compare)}
                  </span>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                    {Math.round(((compare - price) / compare) * 100)}% OFF
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">à vista no PIX</p>
            {installmentPreview.length > 0 && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <CreditCard className="h-4 w-4 text-primary" />
                  PIX parcelado (sem juros)
                </p>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {installmentPreview.map((p) => (
                    <li key={p.count}>
                      {p.count}x de{" "}
                      <span className="font-medium text-foreground">
                        {formatCurrency(p.installmentAmount)}
                      </span>
                      <span className="text-xs"> (total {formatCurrency(p.total)})</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-amber-200/90">
                  O PIX parcelado é uma forma de pagamento própria da loja: você paga cada parcela via PIX nas datas combinadas. Não é parcelamento de cartão de crédito.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            {inStock ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Em estoque</span>
                {lowStock && <span className="text-amber-400">· Últimas unidades</span>}
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-destructive font-medium">Produto indisponível</span>
              </>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <AddToCartButton
              product={{
                product_id: product.id,
                name: product.name,
                slug: product.slug,
                price,
                image: mainImage,
                sku: product.sku || undefined,
              }}
              disabled={!inStock}
              className="flex-1"
            />
            <a
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 text-sm font-medium text-emerald-400 transition hover:bg-emerald-500/20"
            >
              <MessageCircle className="h-4 w-4" />
              Dúvidas no WhatsApp
            </a>
          </div>

          <div className="space-y-4 pt-2">
            <section className="rounded-2xl border border-border bg-card/40 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                <Truck className="h-4 w-4 text-primary" />
                Entrega e frete
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    Prazo estimado de entrega:{" "}
                    <strong className="text-foreground">6 a 15 dias</strong> (estimativa comercial).
                  </span>
                </li>
                <li>
                  Compras a partir de {formatCurrency(FREE_SHIPPING_THRESHOLD)}:{" "}
                  <strong className="text-emerald-400">frete grátis</strong>.
                </li>
                <li>
                  Abaixo de {formatCurrency(FREE_SHIPPING_THRESHOLD)}: frete de{" "}
                  {formatCurrency(FIXED_SHIPPING_COST)}.
                </li>
                <li className="text-xs">
                  {shippingQuote.isFree
                    ? "Este produto sozinho já garante frete grátis."
                    : `Frete estimado para 1 unidade: ${formatCurrency(shippingQuote.cost)}.`}
                </li>
              </ul>
              <div className="mt-4">
                <ProductShippingCep productPrice={price} />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card/40 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                <CreditCard className="h-4 w-4 text-primary" />
                Formas de pagamento
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">PIX à vista</strong> — pagamento único, liberação rápida após confirmação.
                </li>
                <li>
                  <strong className="text-foreground">PIX parcelado</strong> — em até 4x sem juros (quando disponível). Cada parcela é paga via PIX. Não é cartão de crédito.
                </li>
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-card/40 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                <Package className="h-4 w-4 text-primary" />
                Estoque e disponibilidade
              </h2>
              <p className="text-sm text-muted-foreground">
                {inStock
                  ? lowStock
                    ? "Últimas unidades disponíveis. Estoque atualizado em tempo real."
                    : "Produto em estoque e pronto para envio após confirmação do pagamento."
                  : "Produto temporariamente indisponível. Entre em contato para mais informações."}
              </p>
            </section>

            <section className="rounded-2xl border border-border bg-card/40 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                <Shield className="h-4 w-4 text-primary" />
                Garantia
              </h2>
              <p className="text-sm text-muted-foreground">
                Todos os produtos contam com a garantia legal prevista no Código de Defesa do Consumidor.
                {product.warranty_info
                  ? ` ${product.warranty_info}`
                  : " Informações de garantia contratual adicional (quando houver) constam na nota fiscal ou embalagem."}
              </p>
              <Link href="/garantia" className="mt-2 inline-block text-sm text-primary hover:underline">
                Ver política de garantia
              </Link>
            </section>
          </div>
        </div>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {product.description && (
            <section className="rounded-2xl border border-border bg-card/30 p-6">
              <h2 className="mb-4 text-lg font-semibold">Descrição</h2>
              <div className="prose prose-invert max-w-none text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {product.description}
              </div>
            </section>
          )}
          <section className="rounded-2xl border border-border bg-card/30 p-6">
            <h2 className="mb-4 text-lg font-semibold">Especificações técnicas</h2>
            {specs.length > 0 ? (
              <dl className="grid gap-3 sm:grid-cols-2">
                {specs.map((s) => (
                  <div key={s.label} className="flex flex-col rounded-lg bg-secondary/30 px-3 py-2">
                    <dt className="text-xs text-muted-foreground">{s.label}</dt>
                    <dd className="text-sm font-medium">{s.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">
                Especificações técnicas detalhadas sob consulta. Confirme conosco se precisar de dados técnicos específicos.
              </p>
            )}
          </section>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <p className="text-sm font-semibold text-primary mb-2">Por que comprar na Titan Sound?</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Especialistas em som automotivo</li>
              <li>✓ Pagamento seguro via PIX</li>
              <li>✓ Frete grátis a partir de R$ 250</li>
              <li>✓ Atendimento via WhatsApp</li>
            </ul>
          </div>
          <Link href="/produtos" className="block text-center text-sm text-primary hover:underline">
            ← Voltar ao catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
