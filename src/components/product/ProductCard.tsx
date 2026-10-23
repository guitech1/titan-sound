"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price?: number | null;
  image_url?: string | null;
  sku?: string | null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const addItem = useCartStore((s) => s.addItem);
  const price = Number(product.price);
  const compare =
    product.compare_at_price != null ? Number(product.compare_at_price) : null;
  const onSale = compare != null && compare > price;

  return (
    <article className="group flex flex-col rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-colors">
      <Link href={`/produtos/${product.slug}`} className="relative block aspect-square bg-secondary/40">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
            Sem imagem
          </div>
        )}
        {onSale && (
          <span className="absolute top-2 left-2 rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">
            Oferta
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4 gap-2">
        <Link href={`/produtos/${product.slug}`}>
          <h3 className="text-sm font-medium leading-snug line-clamp-2 min-h-[2.5rem] hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <div className="mt-auto">
          <div className="flex flex-wrap items-baseline gap-2 mb-3">
            <span className="text-base font-bold text-primary">{formatCurrency(price)}</span>
            {onSale && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(compare!)}
              </span>
            )}
          </div>
          <Button
            size="sm"
            className="w-full"
            onClick={() =>
              addItem({
                product_id: product.id,
                name: product.name,
                slug: product.slug,
                price,
                image: product.image_url || undefined,
                sku: product.sku || undefined,
              })
            }
          >
            <ShoppingCart className="h-4 w-4" />
            Adicionar
          </Button>
        </div>
      </div>
    </article>
  );
}
