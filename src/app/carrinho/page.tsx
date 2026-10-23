"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { items, updateQuantity, removeItem, getSubtotal } = useCartStore();
  const subtotal = getSubtotal();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Carrinho</h1>
        <p className="text-muted-foreground mb-6">Seu carrinho está vazio.</p>
        <Button asChild><Link href="/produtos">Ver produtos</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Carrinho</h1>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.product_id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.name}</p>
              <p className="text-sm text-primary">{formatCurrency(item.price)}</p>
            </div>
            <input
              type="number"
              min={1}
              className="w-16 h-9 rounded border border-border bg-secondary/50 px-2 text-sm"
              value={item.quantity}
              onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value) || 1)}
            />
            <button className="text-sm text-destructive" onClick={() => removeItem(item.product_id)}>
              Remover
            </button>
          </div>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-lg font-bold">Total: {formatCurrency(subtotal)}</p>
        <Button asChild><Link href="/checkout">Finalizar compra</Link></Button>
      </div>
    </div>
  );
}
