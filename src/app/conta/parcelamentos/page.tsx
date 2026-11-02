"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { formatDueDate } from "@/lib/installments";
import { Button } from "@/components/ui/button";
import { Copy, QrCode } from "lucide-react";

type OrderRow = {
  id: string;
  order_number: string;
  total: number;
  installment_count: number;
  payment_status: string;
  status: string;
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
  pix_copy_paste: string | null;
  pix_qr_code_base64: string | null;
};

export default function CustomerInstallmentsPage() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [installments, setInstallments] = useState<InstallmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activePix, setActivePix] = useState<{
    copy?: string;
    qr?: string;
    amount: number;
    number: number;
  } | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const supabase = createClient();

    const { data: orderData, error: orderErr } = await supabase
      .from("orders")
      .select(
        "id, order_number, total, installment_count, payment_status, status, created_at"
      )
      .eq("user_id", user.id)
      .eq("payment_method", "pix_installment")
      .order("created_at", { ascending: false });

    if (orderErr) {
      setError(orderErr.message);
      setLoading(false);
      return;
    }

    setOrders((orderData as OrderRow[]) || []);

    if (orderData?.length) {
      const ids = orderData.map((o) => o.id);
      const { data: instData } = await supabase
        .from("installments")
        .select(
          "id, order_id, installment_number, amount, due_date, status, paid_at, pix_copy_paste, pix_qr_code_base64"
        )
        .in("order_id", ids)
        .order("installment_number", { ascending: true });
      setInstallments((instData as InstallmentRow[]) || []);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const generatePix = async (installmentId: string) => {
    setGenerating(installmentId);
    try {
      const res = await fetch(`/api/installments/${installmentId}/pix`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Falha ao gerar PIX");
        setGenerating(null);
        return;
      }
      setActivePix({
        copy: data.pix_copy_paste,
        qr: data.pix_qr_code_base64,
        amount: data.amount,
        number: data.number,
      });
      // Atualiza lista local
      setInstallments((prev) =>
        prev.map((i) =>
          i.id === installmentId
            ? {
                ...i,
                pix_copy_paste: data.pix_copy_paste,
                pix_qr_code_base64: data.pix_qr_code_base64,
              }
            : i
        )
      );
    } catch {
      setError("Erro de conexão");
    }
    setGenerating(null);
  };

  if (!user) {
    return (
      <div className="container px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">Meus parcelamentos</h1>
        <p className="mb-6 text-muted-foreground">Faça login para acompanhar.</p>
        <Button asChild>
          <Link href="/auth/login?next=/conta/parcelamentos">Entrar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8 pb-24">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Meus parcelamentos</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe e pague suas parcelas
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/conta">Voltar</Link>
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {activePix && (
        <div className="mb-6 rounded-2xl border border-primary/20 bg-card p-5">
          <p className="mb-1 text-sm text-muted-foreground">
            Parcela {activePix.number} · {formatCurrency(activePix.amount)}
          </p>
          {activePix.qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={
                activePix.qr.startsWith("data:")
                  ? activePix.qr
                  : `data:image/png;base64,${activePix.qr}`
              }
              alt="QR Code"
              className="mx-auto mb-3 h-48 w-48 rounded-xl bg-white p-2"
            />
          )}
          {activePix.copy && (
            <div className="space-y-2">
              <textarea
                readOnly
                value={activePix.copy}
                className="h-20 w-full rounded-xl border border-border bg-secondary/40 p-2 text-xs"
              />
              <Button
                className="w-full"
                onClick={() => navigator.clipboard.writeText(activePix.copy || "")}
              >
                <Copy className="h-4 w-4" />
                Copiar código PIX
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            className="mt-2 w-full"
            onClick={() => setActivePix(null)}
          >
            Fechar
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card/50 p-8 text-center">
          <p className="mb-4 text-muted-foreground">
            Você ainda não possui compras parceladas.
          </p>
          <Button asChild>
            <Link href="/produtos">Ver produtos</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const insts = installments.filter((i) => i.order_id === order.id);
            const paidCount = insts.filter((i) => i.status === "paid").length;
            return (
              <div
                key={order.id}
                className="rounded-2xl border border-border bg-card/60 p-5"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {order.order_number}
                    </p>
                    <p className="text-lg font-bold">
                      {formatCurrency(Number(order.total))}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.installment_count}x · {paidCount}/
                      {order.installment_count} pagas
                    </p>
                  </div>
                  <span className="rounded-md bg-secondary px-2 py-1 text-xs capitalize">
                    {order.payment_status || order.status}
                  </span>
                </div>

                <div className="space-y-2">
                  {insts.map((i) => (
                    <div
                      key={i.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-secondary/20 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {i.installment_number}ª parcela
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Venc. {formatDueDate(i.due_date)}
                          {i.status === "paid" && i.paid_at
                            ? ` · Pago`
                            : ""}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-semibold">
                          {formatCurrency(Number(i.amount))}
                        </span>
                        {i.status === "paid" ? (
                          <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                            Paga
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={generating === i.id}
                            onClick={() => {
                              if (i.pix_copy_paste) {
                                setActivePix({
                                  copy: i.pix_copy_paste,
                                  qr: i.pix_qr_code_base64 || undefined,
                                  amount: Number(i.amount),
                                  number: i.installment_number,
                                });
                              } else {
                                generatePix(i.id);
                              }
                            }}
                          >
                            <QrCode className="h-3.5 w-3.5" />
                            {generating === i.id ? "..." : "Pagar"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
