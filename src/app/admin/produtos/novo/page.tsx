"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    short_description: "",
    price: 0,
    compare_at_price: 0,
    sku: "",
    stock_quantity: 0,
    is_active: true,
    is_featured: false,
    is_best_seller: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const supabase = createClient();

    const slug =
      form.slug ||
      form.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");

    const { error: err } = await supabase.from("products").insert({
      name: form.name,
      slug,
      description: form.description || null,
      short_description: form.short_description || null,
      price: form.price,
      compare_at_price: form.compare_at_price || null,
      sku: form.sku || null,
      stock_quantity: form.stock_quantity,
      is_active: form.is_active,
      is_featured: form.is_featured,
      is_best_seller: form.is_best_seller,
    });

    if (err) {
      setError(err.message);
      setSaving(false);
      return;
    }
    router.push("/admin/produtos");
  };

  const cls =
    "w-full rounded-lg border border-border bg-secondary/50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Novo produto</h1>
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
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
          <label className="block text-sm font-medium mb-1.5">Descrição curta</label>
          <input className={`${cls} h-11`} value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Descrição</label>
          <textarea className={`${cls} py-3 min-h-[100px]`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Preço</label>
            <input type="number" step="0.01" className={`${cls} h-11`} required value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Preço comparado (riscado)</label>
            <input type="number" step="0.01" className={`${cls} h-11`} value={form.compare_at_price || ""} onChange={(e) => setForm({ ...form, compare_at_price: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Estoque</label>
          <input type="number" className={`${cls} h-11`} value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Ativo</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} /> Destaque</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.is_best_seller} onChange={(e) => setForm({ ...form, is_best_seller: e.target.checked })} /> Mais vendido</label>
        </div>
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar produto"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
