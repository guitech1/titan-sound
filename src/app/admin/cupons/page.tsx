"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  usage_limit: number | null;
  usage_count: number | null;
  is_active: boolean | null;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: 10,
    minimum_order_value: 0,
    usage_limit: 100,
    is_active: true,
    expires_at: "",
  });

  const load = async () => {
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("coupons")
      .select("id, code, discount_type, discount_value, usage_limit, usage_count, is_active")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else {
      setError("");
      setCoupons((data as Coupon[]) || []);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    if (!form.code) {
      setError("Informe o código do cupom.");
      return;
    }
    const supabase = createClient();
    const { error: err } = await supabase.from("coupons").insert({
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      minimum_order_value: form.minimum_order_value || null,
      usage_limit: form.usage_limit || null,
      usage_count: 0,
      is_active: form.is_active,
      expires_at: form.expires_at || null,
    });
    if (err) {
      setError(err.message);
      return;
    }
    setSuccess("Cupom criado.");
    setShowForm(false);
    setForm({
      code: "",
      discount_type: "percentage",
      discount_value: 10,
      minimum_order_value: 0,
      usage_limit: 100,
      is_active: true,
      expires_at: "",
    });
    load();
  };

  const toggle = async (id: string, active: boolean) => {
    const supabase = createClient();
    const { error: err } = await supabase.from("coupons").update({ is_active: !active }).eq("id", id);
    if (err) setError(err.message);
    else load();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este cupom?")) return;
    const supabase = createClient();
    const { error: err } = await supabase.from("coupons").delete().eq("id", id);
    if (err) setError(err.message);
    else {
      setSuccess("Cupom excluído.");
      load();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cupons</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" /> Novo cupom
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
            placeholder="Código"
            className="w-full h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm uppercase"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              className="h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm"
              value={form.discount_type}
              onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
            >
              <option value="percentage">Percentual (%)</option>
              <option value="fixed">Valor fixo (R$)</option>
            </select>
            <input
              type="number"
              className="h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm"
              value={form.discount_value}
              onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Pedido mínimo"
              className="h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm"
              value={form.minimum_order_value || ""}
              onChange={(e) => setForm({ ...form, minimum_order_value: parseFloat(e.target.value) || 0 })}
            />
            <input
              type="number"
              placeholder="Limite de usos"
              className="h-10 rounded-lg border border-border bg-secondary/50 px-3 text-sm"
              value={form.usage_limit || ""}
              onChange={(e) => setForm({ ...form, usage_limit: parseInt(e.target.value) || 0 })}
            />
          </div>
          <input
            type="date"
            className="h-10 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm"
            value={form.expires_at}
            onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Ativo
          </label>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Criar</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-muted-foreground">
            <tr>
              <th className="text-left p-3">Código</th>
              <th className="text-left p-3">Tipo</th>
              <th className="text-right p-3">Valor</th>
              <th className="text-right p-3">Usos</th>
              <th className="text-center p-3">Status</th>
              <th className="text-right p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3 font-mono font-medium">{c.code}</td>
                <td className="p-3">{c.discount_type === "percentage" ? "%" : "R$"}</td>
                <td className="p-3 text-right">{c.discount_value}</td>
                <td className="p-3 text-right">{c.usage_count ?? 0}/{c.usage_limit ?? "∞"}</td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => toggle(c.id, !!c.is_active)}
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      c.is_active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.is_active ? "Ativo" : "Inativo"}
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => remove(c.id)} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum cupom.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
