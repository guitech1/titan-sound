import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("id, name, slug, price, compare_at_price, stock_quantity, is_active")
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
      {error && (
        <p className="text-sm text-destructive mb-4">{error.message}</p>
      )}
      {!products?.length ? (
        <p className="text-muted-foreground py-12 text-center">
          Nenhum produto encontrado.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => {
            const price = Number(p.price);
            const compare = p.compare_at_price != null ? Number(p.compare_at_price) : null;
            const display =
              compare != null && compare > price ? price : price;
            return (
              <Link
                key={p.id}
                href={`/produtos/${p.slug}`}
                className="rounded-xl border border-border bg-card p-4 hover:border-primary/50 transition-colors"
              >
                <div className="aspect-square rounded-lg bg-secondary/50 mb-3" />
                <h2 className="font-medium text-sm line-clamp-2 mb-2">{p.name}</h2>
                <div className="flex items-baseline gap-2">
                  <p className="text-primary font-bold">{formatCurrency(display)}</p>
                  {compare != null && compare > price && (
                    <p className="text-xs text-muted-foreground line-through">
                      {formatCurrency(compare)}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
