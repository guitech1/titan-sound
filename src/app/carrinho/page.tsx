"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  calculateShipping,
  freeShippingProgressMessage,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/shipping";
import { Minus, Plus, Trash2, ShoppingBag, Truck, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { items, updateQuantity, removeItem, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();
  const shipping = calculateShipping(subtotal);
  const total = subtotal + shipping.cost;
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <ShoppingBag className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Seu carrinho está vazio</h1>
        <p className="text-muted-foreground mb-6">
          Explore nosso catálogo de som automotivo e encontre o equipamento ideal.
        </p>
        <Button asChild size="lg">
          <Link href="/produtos">Ver produtos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <h1 className="text-2xl font-bold mb-6 md:text-3xl">Carrinho</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.product_id}
              className="flex gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-secondary/30">
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    —
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-between">
                <div>
                  <Link
                    href={`/produtos/${item.slug}`}
                    className="font-medium hover:text-primary line-clamp-2"
                  >
                    {item.name}
                  </Link>
                  {item.sku && (
                    <p className="text-xs text-muted-foreground mt-0.5">SKU {item.sku}</p>
                  )}
                  <p className="mt-1 text-sm text-primary font-semibold">
                    {formatCurrency(item.price)}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center rounded-lg border border-border">
                    <button
                      type="button"
                      aria-label="Diminuir quantidade"
                      className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
                      onClick={() =>
                        updateQuantity(item.product_id, Math.max(1, item.quantity - 1))
                      }
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Aumentar quantidade"
                      className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-foreground"
                      onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                    <button
                      type="button"
                      aria-label="Remover item"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeItem(item.product_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link href="/produtos">Continuar comprando</Link>
          </Button>
        </div>

        <div className="lg:sticky lg:top-24 h-fit space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <Truck className="h-4 w-4 text-primary" />
              {freeShippingProgressMessage(subtotal)}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full rounded-full transition-all ${
                  shipping.isFree ? "bg-emerald-500" : "bg-primary"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {shipping.isFree
                ? "Frete grátis aplicado neste pedido."
                : `Frete de ${formatCurrency(shipping.cost)} · Grátis a partir de ${formatCurrency(FREE_SHIPPING_THRESHOLD)}`}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h2 className="font-semibold">Resumo do pedido</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Frete</span>
              <span className={shipping.isFree ? "text-emerald-400 font-medium" : ""}>
                {shipping.isFree ? "Grátis" : formatCurrency(shipping.cost)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{shipping.estimatedLabel}</p>
            <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
            <Button asChild size="lg" className="w-full gap-2">
              <Link href="/checkout">
                Finalizar pedido
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Pagamento seguro via PIX · Você revisará os dados no checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
