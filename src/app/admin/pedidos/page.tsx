"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

export default function AdminOrdersPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error: err } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(50);
      if (err) setError(err.message);
      else setRows((data as Record<string, unknown>[]) || []);
      setLoading(false);
    })();
  }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Pedidos</h1>
      {error && <div className="mb-4 text-sm text-destructive">{error}</div>}
      {loading ? <p className="text-muted-foreground">Carregando...</p> : rows.length === 0 ? (
        <p className="text-muted-foreground">Nenhum pedido.</p>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50"><tr>
              <th className="text-left p-3">Pedido</th>
              <th className="text-left p-3">Status</th>
              <th className="text-right p-3">Total</th>
            </tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="p-3 font-mono">{String(r.order_number ?? r.id)}</td>
                  <td className="p-3">{String(r.status ?? "")}</td>
                  <td className="p-3 text-right">{formatCurrency(Number(r.total ?? 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
