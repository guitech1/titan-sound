"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { formatDueDate } from "@/lib/installments";

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  installment_count: number;
  buyer_full_name: string | null;
  created_at: string;
};

type InstallmentRow = {
  id: string;
  order_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  paid_at: string | null;
};

export default function AdminPixParceladoPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [installments, setInstallments] = useState<InstallmentRow[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { data: orderData, error: orderErr } = await supabase
      .from("orders")
      .select(
        "id, order_number, status, payment_status, total, installment_count, buyer_full_name, created_at"
      )
      .eq("payment_method", "pix_installment")
      .order("created_at", { ascending: false })
      .limit(100);

    if (orderErr) {
      setError(
        orderErr.message +
          " — Verifique se o schema PIX_PARCELADO_SCHEMA.sql foi executado no Supabase."
      );
      setLoading(false);
      return;
    }

    setOrders((orderData as OrderRow[]) || []);

    if (orderData?.length) {
      const ids = orderData.map((o) => o.id);
      const { data: instData } = await supabase
        .from("installments")
        .select(
          "id, order_id, installment_number, amount, due_date, status, paid_at"
        )
        .in("order_id", ids)
        .order("installment_number", { ascending: true });
      setInstallments((instData as InstallmentRow[]) || []);
    } else {
      setInstallments([]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = orders.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.order_number?.toLowerCase().includes(q) ||
      o.buyer_full_name?.toLowerCase().includes(q) ||
      o.id.includes(q)
    );
  });

  const selectedInstallments = selectedOrderId
    ? installments.filter((i) => i.order_id === selectedOrderId)
    : [];

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-500/15 text-amber-300",
      paid: "bg-emerald-500/15 text-emerald-300",
      overdue: "bg-red-500/15 text-red-300",
      canceled: "bg-slate-500/15 text-slate-400",
      partial: "bg-sky-500/15 text-sky-300",
      awaiting_payment: "bg-amber-500/15 text-amber-300",
    };
    return map[status] || "bg-secondary text-muted-foreground";
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pix Parcelado</h1>
          <p className="text-sm text-muted-foreground">
            Gerenciamento interno de pedidos parcelados
          </p>
        </div>
        <input
          className="h-10 w-full rounded-xl border border-border bg-secondary/40 px-3 text-sm sm:w-64"
          placeholder="Buscar pedido ou cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">Nenhum pedido parcelado encontrado.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="p-3 text-left">Pedido</th>
                    <th className="p-3 text-left">Cliente</th>
                    <th className="p-3 text-left">Parcelas</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => setSelectedOrderId(o.id)}
                      className={`cursor-pointer border-t border-border transition-colors hover:bg-secondary/30 ${
                        selectedOrderId === o.id ? "bg-primary/10" : ""
                      }`}
                    >
                      <td className="p-3 font-mono text-xs">{o.order_number}</td>
                      <td className="p-3">{o.buyer_full_name || "—"}</td>
                      <td className="p-3">{o.installment_count}x</td>
                      <td className="p-3 text-right">{formatCurrency(Number(o.total))}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${statusBadge(
                            o.payment_status || o.status
                          )}`}
                        >
                          {o.payment_status || o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedOrderId ? (
              <div className="rounded-xl border border-border bg-card p-4">
                <h2 className="mb-3 font-semibold">Parcelas do pedido</h2>
                <div className="space-y-2">
                  {selectedInstallments.map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-secondary/20 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {i.installment_number}ª parcela
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Venc. {formatDueDate(i.due_date)}
                          {i.paid_at
                            ? ` · Pago em ${new Date(i.paid_at).toLocaleDateString("pt-BR")}`
                            : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(Number(i.amount))}</p>
                        <span
                          className={`text-xs font-medium ${statusBadge(i.status)}`}
                        >
                          {i.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {selectedInstallments.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma parcela registrada (verifique o schema).
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Selecione um pedido para ver as parcelas.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
