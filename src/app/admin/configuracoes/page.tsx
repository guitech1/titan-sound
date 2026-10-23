"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const KEYS = [
  { key: "store_name", label: "Nome da loja" },
  { key: "contact_email", label: "E-mail de contato" },
  { key: "contact_phone", label: "Telefone" },
  { key: "whatsapp", label: "WhatsApp (somente números)" },
  { key: "address", label: "Endereço" },
] as const;

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Record<string, string>>({
    store_name: "TITAN SOUND",
    contact_email: "",
    contact_phone: "",
    whatsapp: "573502625621",
    address: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error: err } = await supabase.from("site_settings").select("key, value");
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      const next = { ...form };
      (data || []).forEach((row: { key: string; value: unknown }) => {
        if (row.key in next) {
          const v = row.value;
          next[row.key] =
            typeof v === "string" ? v : v != null ? String(v).replace(/^"|"$/g, "") : "";
        }
      });
      setForm(next);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    setError("");
    setSuccess("");
    const supabase = createClient();
    for (const { key } of KEYS) {
      const { error: err } = await supabase.from("site_settings").upsert(
        {
          key,
          value: form[key] ?? "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
      if (err) {
        setError(err.message);
        return;
      }
    }
    setSuccess("Configurações salvas.");
  };

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Configurações da loja</h1>
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{success}</div>
      )}
      <div className="space-y-4">
        {KEYS.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-1.5">{label}</label>
            <input
              className="w-full h-11 rounded-lg border border-border bg-secondary/50 px-4 text-sm"
              value={form[key] || ""}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </div>
        ))}
        <Button onClick={save}>Salvar configurações</Button>
      </div>
    </div>
  );
}
