"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Row {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  compare_at_price: number | null;
  stock_quantity: number | null;
  is_active: boolean | null;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("products")
      .select("id, name, sku, price, compare_at_price, stock_quantity, is_active")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setProducts((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    const supabase = createClient();
    const { error: err } = await supabase.from("products").delete().eq("id", id);
    if (err) alert(err.message);
    else load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">{products.length} cadastrados</p>
        </div>
        <Button asChild>
          <Link href="/admin/produtos/novo">
            <Plus className="h-4 w-4" /> Novo produto
          </Link>
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">SKU</th>
                <th className="text-right p-3">Preço</th>
                <th className="text-right p-3">Estoque</th>
                <th className="text-center p-3">Status</th>
                <th className="text-right p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-3 font-medium max-w-[240px] truncate">{p.name}</td>
                  <td className="p-3 text-muted-foreground">{p.sku}</td>
                  <td className="p-3 text-right">{formatCurrency(Number(p.price))}</td>
                  <td className="p-3 text-right">{p.stock_quantity ?? 0}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        p.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {p.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/produtos/${p.id}`} className="p-2 rounded-lg hover:bg-secondary">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => remove(p.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nenhum produto.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
