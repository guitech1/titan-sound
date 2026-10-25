"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadProductImage } from "@/lib/storage";
import { normalizePrice, normalizeCompareAtPrice } from "@/lib/product-prices";
import { Button } from "@/components/ui/button";
import { ImagePlus, Trash2, Star } from "lucide-react";

interface LocalImage {
  file: File;
  preview: string;
  isPrimary: boolean;
}

export default function NewProductPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<LocalImage[]>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
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

  const onFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const next: LocalImage[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      next.push({ file, preview: URL.createObjectURL(file), isPrimary: false });
    });
    setImages((prev) => {
      const merged = [...prev, ...next];
      if (!merged.some((i) => i.isPrimary) && merged[0]) merged[0].isPrimary = true;
      return merged;
    });
  };

  const setPrimary = (idx: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === idx })));
  };

  const removeImage = (idx: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length && !next.some((i) => i.isPrimary)) next[0].isPrimary = true;
      return next;
    });
  };

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

    if (!form.name.trim()) {
      setError("Informe o nome do produto.");
      setSaving(false);
      return;
    }

    const baseSlug =
      (form.slug.trim() ||
        form.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, "")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")) || "produto";

    const supabase = createClient();

    // Garante um slug livre sem alterar nem sobrescrever produtos existentes.
    let slug = baseSlug;
    let suffix = 2;
    while (true) {
      const { data: existing, error: slugCheckError } = await supabase
        .from("products")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (slugCheckError) {
        setError("Não foi possível verificar a URL do produto: " + slugCheckError.message);
        setSaving(false);
        return;
      }
      if (!existing) break;
      slug = `${baseSlug}-${suffix++}`;
    }
    const payload = {
      name: form.name.trim(),
      slug,
      description: form.description.trim() || null,
      short_description: form.short_description.trim() || null,
      price,
      compare_at_price,
      sku: form.sku.trim() || null,
      stock_quantity,
      is_active: form.is_active,
      is_featured: form.is_featured,
      is_best_seller: form.is_best_seller,
    };

    const { data: product, error: err } = await supabase
      .from("products")
      .insert(payload)
      .select("id")
      .single();

    if (err || !product) {
      setError(err?.message || "Falha ao salvar produto.");
      setSaving(false);
      return;
    }

    const ordered = [...images].sort((a, b) =>
      a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1
    );
    for (let i = 0; i < ordered.length; i++) {
      try {
        const up = await uploadProductImage(ordered[i].file, `products/${product.id}`);
        const { error: imgErr } = await supabase.from("product_images").insert({
          product_id: product.id,
          image_url: up.url,
          alt_text: form.name.trim(),
          sort_order: i,
        });
        if (imgErr) {
          setError(`Produto salvo, erro ao registrar imagem: ${imgErr.message}`);
          setSaving(false);
          return;
        }
      } catch (uploadErr) {
        setError(
          `Produto salvo, mas falha na imagem ${i + 1}: ${
            uploadErr instanceof Error ? uploadErr.message : String(uploadErr)
          }`
        );
        setSaving(false);
        return;
      }
    }

    setSaving(false);
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
            <label className="block text-sm font-medium mb-1.5">Preço de venda (R$)</label>
            <input type="number" step="0.01" min="0.01" className={`${cls} h-11`} required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Preço comparado / riscado (opcional)</label>
            <input type="number" step="0.01" min="0" className={`${cls} h-11`} placeholder="Deixe vazio se não houver" value={form.compare_at_price} onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })} />
            <p className="text-xs text-muted-foreground mt-1">Se informado, deve ser maior que o preço de venda. Campo vazio = null no banco.</p>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Estoque</label>
          <input type="number" min="0" className={`${cls} h-11`} value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Fotos do produto</label>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="h-4 w-4" /> Selecionar imagens
          </Button>
          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative rounded-lg border border-border overflow-hidden aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.preview} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 flex gap-1 p-1 bg-black/60">
                    <button type="button" title="Principal" onClick={() => setPrimary(idx)} className={`flex-1 flex items-center justify-center rounded p-1 ${img.isPrimary ? "text-primary" : "text-white/80"}`}>
                      <Star className="h-3.5 w-3.5" fill={img.isPrimary ? "currentColor" : "none"} />
                    </button>
                    <button type="button" title="Remover" onClick={() => removeImage(idx)} className="flex-1 flex items-center justify-center rounded p-1 text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
