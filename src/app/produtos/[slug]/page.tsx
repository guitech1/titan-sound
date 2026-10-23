import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { AddToCartButton } from "@/components/product/AddToCartButton";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
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
  const compare =
    product.compare_at_price != null ? Number(product.compare_at_price) : null;
  const images = ((product.product_images || []) as {
    id: string;
    image_url: string;
    alt_text?: string;
    sort_order?: number;
  }[]).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const mainImage = images[0]?.image_url;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="aspect-square rounded-xl border border-border bg-secondary/30 overflow-hidden">
            {mainImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">Sem imagem</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={img.image_url}
                  alt={img.alt_text || product.name}
                  className="aspect-square rounded-lg border border-border object-cover"
                />
              ))}
            </div>
          )}
        </div>
        <div>
          {product.sku && <p className="text-xs text-muted-foreground mb-1">SKU {product.sku}</p>}
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-2xl font-bold text-primary">{formatCurrency(price)}</span>
            {compare != null && compare > price && (
              <span className="text-muted-foreground line-through">{formatCurrency(compare)}</span>
            )}
          </div>
          {product.short_description && (
            <p className="text-muted-foreground mb-6">{product.short_description}</p>
          )}
          <AddToCartButton
            product={{
              product_id: product.id,
              name: product.name,
              slug: product.slug,
              price,
              image: mainImage,
              sku: product.sku || undefined,
            }}
            disabled={(product.stock_quantity ?? 0) < 1}
          />
          {(product.stock_quantity ?? 0) < 1 && (
            <p className="text-sm text-destructive mt-2">Fora de estoque</p>
          )}
          {product.description && (
            <div className="mt-8 text-sm text-muted-foreground whitespace-pre-wrap">
              {product.description}
            </div>
          )}
          <Link href="/produtos" className="inline-block mt-8 text-sm text-primary hover:underline">
            Voltar ao catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
