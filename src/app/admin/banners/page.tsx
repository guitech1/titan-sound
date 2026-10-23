"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AdminBannersPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error: err } = await supabase.from("banners").select("*").order("sort_order").limit(50);
      if (err) setError(err.message);
      else setRows((data as Record<string, unknown>[]) || []);
      setLoading(false);
    })();
  }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Banners</h1>
      {error && <div className="mb-4 text-sm text-destructive">{error}</div>}
      {loading ? <p className="text-muted-foreground">Carregando...</p> : rows.length === 0 ? (
        <p className="text-muted-foreground">Nenhum banner cadastrado.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 text-sm">
              <p className="font-medium">{String(r.title ?? "")}</p>
              <p className="text-muted-foreground">{String(r.target_url ?? "")}</p>
              <p className="text-xs mt-1">{r.is_active ? "Ativo" : "Inativo"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
