import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product/ProductCard";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("id, name, slug, price, compare_at_price, sku, is_active, product_images(image_url, sort_order)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(48);

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  }

  const { data: products, error } = await query;

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-2">Produtos</h1>
      {q && (
        <p className="text-sm text-muted-foreground mb-6">
          Resultados para &ldquo;{q}&rdquo;
        </p>
      )}
      {error && <p className="text-sm text-destructive mb-4">{error.message}</p>}
      {!products?.length ? (
        <p className="text-muted-foreground py-12 text-center">Nenhum produto encontrado.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {products.map((p) => {
            const images = (p.product_images || []) as {
              image_url: string;
              sort_order?: number;
            }[];
            images.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
            return (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  price: Number(p.price),
                  compare_at_price: p.compare_at_price,
                  sku: p.sku,
                  image_url: images[0]?.image_url || null,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
