import { createClient } from "@/lib/supabase/server";

export default async function ReviewsPage() {
  const supabase = await createClient();
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("id, author_name, rating, comment, created_at")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="container mx-auto px-4 py-10 pb-24">
      <h1 className="text-2xl font-bold mb-2">Avaliações</h1>
      <p className="text-sm text-muted-foreground mb-8">Depoimentos publicados pela TITAN SOUND</p>
      {error && <p className="text-sm text-destructive mb-4">{error.message}</p>}
      {!reviews?.length ? (
        <p className="text-muted-foreground py-12 text-center">Nenhuma avaliação publicada.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <article key={r.id} className="rounded-2xl border border-white/5 bg-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold">{r.author_name}</span>
                <span className="text-primary text-sm">{"\u2605".repeat(r.rating)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{r.comment}</p>
              {r.created_at && (
                <p className="text-xs text-muted-foreground mt-3">
                  {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
