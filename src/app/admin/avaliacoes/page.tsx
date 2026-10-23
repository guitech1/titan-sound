"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface Review {
  id: string;
  author_name: string;
  rating: number;
  comment: string;
  is_published: boolean | null;
  created_at: string | null;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    author_name: "",
    rating: 5,
    comment: "",
    is_published: true,
  });

  const load = async () => {
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("reviews")
      .select("id, author_name, rating, comment, is_published, created_at")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else {
      setError("");
      setReviews((data as Review[]) || []);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!form.author_name || !form.comment) {
      setError("Nome e comentário são obrigatórios.");
      return;
    }
    const supabase = createClient();
    const { error: err } = await supabase.from("reviews").insert({
      author_name: form.author_name,
      rating: form.rating,
      comment: form.comment,
      is_published: form.is_published,
    });
    if (err) {
      setError(err.message);
      return;
    }
    setSuccess("Avaliação cadastrada.");
    setShowForm(false);
    setForm({ author_name: "", rating: 5, comment: "", is_published: true });
    load();
  };

  const toggle = async (id: string, published: boolean) => {
    const supabase = createClient();
    const { error: err } = await supabase
      .from("reviews")
      .update({ is_published: !published })
      .eq("id", id);
    if (err) setError(err.message);
    else load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta avaliação?")) return;
    const supabase = createClient();
    const { error: err } = await supabase.from("reviews").delete().eq("id", id);
    if (err) setError(err.message);
    else {
      setSuccess("Avaliação excluída.");
      load();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Avaliações</h1>
          <p className="text-sm text-muted-foreground">
            Somente o administrador cadastra. Visitantes veem as publicadas.
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Nova avaliação
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{success}</div>
      )}

      {showForm && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 space-y-3 max-w-xl">
          <input
            placeholder="Nome do avaliador"
            className="w-full h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm"
            value={form.author_name}
            onChange={(e) => setForm({ ...form, author_name: e.target.value })}
          />
          <select
            className="h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm"
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} estrelas</option>
            ))}
          </select>
          <textarea
            placeholder="Comentário"
            className="w-full min-h-[80px] rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm"
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
            />
            Publicar
          </label>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Cadastrar</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-xl border border-border bg-card p-4 flex justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{r.author_name}</span>
                <span className="text-primary text-sm">{"★".repeat(r.rating)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{r.comment}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {r.created_at ? new Date(r.created_at).toLocaleDateString("pt-BR") : ""}{" · "}
                {r.is_published ? "Publicada" : "Oculta"}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => toggle(r.id, !!r.is_published)} className="p-2 rounded-lg hover:bg-secondary">
                {r.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              <button onClick={() => remove(r.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhuma avaliação cadastrada.</p>
        )}
      </div>
    </div>
  );
}
