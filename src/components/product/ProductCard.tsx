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
  promotional_price?: number | null;
  images?: { url: string; is_primary?: boolean }[];
}

function resolveImage(p: ProductCardData): string | null {
  if (p.image_url) return p.image_url;
  if (p.images?.length) {
    const primary = p.images.find((i) => i.is_primary) || p.images[0];
    return primary?.url || null;
  }
  return null;
}

function resolveCompare(p: ProductCardData): number | null {
  if (p.compare_at_price != null) return Number(p.compare_at_price);
  return null;
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const addItem = useCartStore((s) => s.addItem);
  const price = Number(product.price);
  const compare = resolveCompare(product);
  const onSale = compare != null && compare > price;
  const image = resolveImage(product);

  return (
    <article className="group flex flex-col rounded-2xl border border-white/5 bg-gradient-to-b from-card to-[#080d18] overflow-hidden shadow-lg shadow-black/40 hover:border-primary/40 hover:shadow-primary/10 transition-all duration-300">
      <Link href={`/produtos/${product.slug}`} className="relative block aspect-square bg-[#0a1020]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
            Sem imagem
          </div>
        )}
        {onSale && (
          <span className="absolute top-2 left-2 rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-primary/40">
            OFERTA
          </span>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4 gap-2">
        <Link href={`/produtos/${product.slug}`}>
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 min-h-[2.5rem] text-white/95 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="mt-auto space-y-2">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-lg font-bold text-primary tracking-tight">
              {formatCurrency(price)}
            </span>
            {onSale && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(compare!)}
              </span>
            )}
          </div>
          <Button
            size="sm"
            className="w-full rounded-xl font-semibold shadow-md shadow-primary/20"
            onClick={() =>
              addItem({
                product_id: product.id,
                name: product.name,
                slug: product.slug,
                price,
                image: image || undefined,
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
