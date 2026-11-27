import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product/ProductCard";
import { Search } from "lucide-react";

export const metadata = {
  title: "Produtos | Titan Sound",
  description: "Catálogo de som automotivo — alto-falantes, amplificadores e mais.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categoria?: string }>;
}) {
  const { q, categoria } = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  let query = supabase
    .from("products")
    .select(
      "id, name, slug, price, compare_at_price, sku, is_active, stock_quantity, category_id, product_images(image_url, sort_order)"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(48);

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%`);
  }

  if (categoria && categories?.length) {
    const cat = categories.find(
      (c) => c.slug === categoria || c.id === categoria
    );
    if (cat) {
      query = query.eq("category_id", cat.id);
    }
  }

  const { data: products, error } = await query;

  return (
    <div className="container mx-auto px-4 py-8 md:py-10">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Produtos</h1>
          {q && (
            <p className="mt-1 text-sm text-muted-foreground">
              Resultados para &ldquo;{q}&rdquo;
            </p>
          )}
        </div>
        <form action="/produtos" method="get" className="flex gap-2">
          {categoria && (
            <input type="hidden" name="categoria" value={categoria} />
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="q"
              defaultValue={q || ""}
              placeholder="Buscar produto ou SKU..."
              className="h-10 w-full min-w-[200px] rounded-xl border border-border bg-secondary/40 pl-9 pr-3 text-sm outline-none focus:border-primary sm:w-64"
            />
          </div>
          <button
            type="submit"
            className="h-10 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Buscar
          </button>
        </form>
      </div>

      {categories && categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href={q ? `/produtos?q=${encodeURIComponent(q)}` : "/produtos"}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              !categoria
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            Todas
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/produtos?categoria=${cat.slug || cat.id}${
                q ? `&q=${encodeURIComponent(q)}` : ""
              }`}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                categoria === cat.slug || categoria === cat.id
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {error && (
        <p className="mb-4 text-sm text-destructive">{error.message}</p>
      )}

      {!products?.length ? (
        <p className="py-16 text-center text-muted-foreground">
          Nenhum produto encontrado.
          {(q || categoria) && (
            <>
              {" "}
              <Link href="/produtos" className="text-primary hover:underline">
                Ver todos
              </Link>
            </>
          )}
        </p>
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
