"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadProductImage } from "@/lib/storage";
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
    price: 0,
    compare_at_price: 0,
    sku: "",
    stock_quantity: 0,
    is_active: true,
    is_featured: false,
    is_best_seller: false,
  });

  const onFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const next: LocalImage[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      next.push({
        file,
        preview: URL.createObjectURL(file),
        isPrimary: false,
      });
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
    const supabase = createClient();

    const slug =
      form.slug ||
      form.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^\w-]/g, "");

    const { data: product, error: err } = await supabase
      .from("products")
      .insert({
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
      })
      .select("id")
      .single();

    if (err || !product) {
      setError(err?.message || "Falha ao salvar produto");
      setSaving(false);
      return;
    }

    const ordered = [...images].sort((a, b) =>
      a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1
    );
    for (let i = 0; i < ordered.length; i++) {
      const up = await uploadProductImage(ordered[i].file, product.id);
      if (up.error || !up.url) {
        setError(`Produto salvo, mas falha na imagem ${i + 1}: ${up.error}`);
        setSaving(false);
        return;
      }
      const { error: imgErr } = await supabase.from("product_images").insert({
        product_id: product.id,
        image_url: up.url,
        alt_text: form.name,
        sort_order: i,
      });
      if (imgErr) {
        setError(`Produto salvo, erro ao registrar imagem: ${imgErr.message}`);
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
            <label className="block text-sm font-medium mb-1.5">Preço</label>
            <input type="number" step="0.01" className={`${cls} h-11`} required value={form.price || ""} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Preço comparado</label>
            <input type="number" step="0.01" className={`${cls} h-11`} value={form.compare_at_price || ""} onChange={(e) => setForm({ ...form, compare_at_price: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Estoque</label>
          <input type="number" className={`${cls} h-11`} value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">Fotos do produto</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="h-4 w-4" />
            Selecionar imagens
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
          <p className="text-xs text-muted-foreground mt-2">
            A estrela define a imagem principal. Upload no bucket titan-sound-media.
          </p>
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
