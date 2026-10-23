"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { normalizePrice, normalizeCompareAtPrice } from "@/lib/product-prices";
import { Button } from "@/components/ui/button";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    short_description: "",
    price: "",
    compare_at_price: "",
    sku: "",
    stock_quantity: "0",
    is_active: true,
    is_featured: false,
    is_best_seller: false,
  });

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("products")
        .select("name, description, short_description, price, compare_at_price, sku, stock_quantity, is_active, is_featured, is_best_seller")
        .eq("id", id)
        .maybeSingle();
      if (err || !data) {
        setError(err?.message || "Produto não encontrado.");
        setLoading(false);
        return;
      }
      setForm({
        name: data.name || "",
        description: data.description || "",
        short_description: data.short_description || "",
        price: data.price != null ? String(data.price) : "",
        compare_at_price:
          data.compare_at_price != null && Number(data.compare_at_price) > 0
            ? String(data.compare_at_price)
            : "",
        sku: data.sku || "",
        stock_quantity: String(data.stock_quantity ?? 0),
        is_active: data.is_active ?? true,
        is_featured: data.is_featured ?? false,
        is_best_seller: data.is_best_seller ?? false,
      });
      setLoading(false);
    })();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const priceResult = normalizePrice(form.price);
    if (priceResult.error || priceResult.value === null) {
      setError(priceResult.error || "Preço inválido.");
      setSaving(false);
      return;
    }
    const price = priceResult.value;

    const compareResult = normalizeCompareAtPrice(form.compare_at_price, price);
    if (compareResult.error) {
      setError(compareResult.error);
      setSaving(false);
      return;
    }
    const compare_at_price: number | null = compareResult.value;

    const stock = parseInt(form.stock_quantity, 10);
    const stock_quantity = Number.isFinite(stock) && stock >= 0 ? stock : 0;

    const supabase = createClient();
    const { error: err } = await supabase
      .from("products")
      .update({
        name: form.name.trim(),
        description: form.description.trim() || null,
        short_description: form.short_description.trim() || null,
        price,
        compare_at_price,
        sku: form.sku.trim() || null,
        stock_quantity,
        is_active: form.is_active,
        is_featured: form.is_featured,
        is_best_seller: form.is_best_seller,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    router.push("/admin/produtos");
  };

  const remove = async () => {
    if (!confirm("Excluir este produto?")) return;
    const supabase = createClient();
    const { error: err } = await supabase.from("products").delete().eq("id", id);
    if (err) setError(err.message);
    else router.push("/admin/produtos");
  };

  const cls =
    "w-full rounded-lg border border-border bg-secondary/50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Editar produto</h1>
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Nome</label>
          <input className={`${cls} h-11`} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">SKU</label>
          <input className={`${cls} h-11`} value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Descrição</label>
          <textarea className={`${cls} py-3 min-h-[100px]`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Preço de venda (R$)</label>
            <input type="number" step="0.01" min="0.01" className={`${cls} h-11`} required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Preço comparado (opcional)</label>
            <input type="number" step="0.01" min="0" className={`${cls} h-11`} placeholder="Vazio = sem promoção" value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Estoque</label>
          <input type="number" min="0" className={`${cls} h-11`} value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Ativo</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Destaque</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_best_seller} onChange={(e) => setForm({ ...form, is_best_seller: e.target.checked })} /> Mais vendido</label>
        </div>
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar alterações"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
          <Button type="button" variant="destructive" onClick={remove}>Excluir</Button>
        </div>
      </form>
    </div>
  );
}
