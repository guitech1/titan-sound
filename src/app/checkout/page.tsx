"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  const { items, getSubtotal, clear } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const subtotal = getSubtotal();
  const shipping = subtotal >= 299 ? 0 : 25;
  const total = subtotal + shipping;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pix, setPix] = useState<{
    copy?: string;
    qr?: string;
    order_number?: string;
  } | null>(null);

  const [form, setForm] = useState({
    name: user?.full_name || "",
    email: user?.email || "",
    phone: "",
    postal_code: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const fetchCep = async () => {
    const cep = form.postal_code.replace(/\D/g, "");
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((f) => ({
          ...f,
          street: data.logradouro || f.street,
          neighborhood: data.bairro || f.neighborhood,
          city: data.localidade || f.city,
          state: data.uf || f.state,
        }));
      }
    } catch {
      /* ignore */
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) {
      setError("Carrinho vazio.");
      return;
    }
    if (!user) {
      setError("Faça login para finalizar a compra.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          })),
          address: {
            recipient_name: form.name,
            phone: form.phone,
            postal_code: form.postal_code,
            street: form.street,
            number: form.number,
            complement: form.complement,
            neighborhood: form.neighborhood,
            city: form.city,
            state: form.state,
          },
          customer_email: form.email,
          customer_name: form.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.detail
            ? `${data.message || "Erro"}: ${data.detail}`
            : data.message || "Falha no checkout."
        );
        setLoading(false);
        return;
      }
      setPix({
        copy: data.pix_copy_paste,
        qr: data.pix_qr_code_base64,
        order_number: data.order_number,
      });
      clear();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    }
    setLoading(false);
  };

  if (!items.length && !pix) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="mb-4 text-slate-400">Seu carrinho está vazio.</p>
        <Button asChild>
          <Link href="/produtos">Ver produtos</Link>
        </Button>
      </div>
    );
  }

  if (pix) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-10">
        <h1 className="mb-2 text-2xl font-bold">PIX gerado</h1>
        <p className="mb-6 text-sm text-slate-400">
          Pedido {pix.order_number}. Escaneie o QR Code ou copie o código.
        </p>
        {pix.qr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={
              pix.qr.startsWith("data:")
                ? pix.qr
                : `data:image/png;base64,${pix.qr}`
            }
            alt="QR Code PIX"
            className="mx-auto mb-4 h-56 w-56 rounded-xl bg-white p-2"
          />
        )}
        {pix.copy && (
          <div className="space-y-2">
            <textarea
              readOnly
              value={pix.copy}
              className="h-24 w-full rounded-xl border border-border bg-secondary/50 p-3 text-xs"
            />
            <Button
              type="button"
              className="w-full"
              onClick={() => navigator.clipboard.writeText(pix.copy || "")}
            >
              Copiar código PIX
            </Button>
          </div>
        )}
        <Button asChild variant="outline" className="mt-4 w-full">
          <Link href="/">Voltar à loja</Link>
        </Button>
      </div>
    );
  }

  const cls =
    "h-11 w-full rounded-lg border border-border bg-secondary/50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-12">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      {!user && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Você precisa estar logado para finalizar a compra.{" "}
          <Link href="/auth/login?next=/checkout" className="font-semibold underline">
            Entrar
          </Link>{" "}
          ou{" "}
          <Link href="/auth/cadastro?next=/checkout" className="font-semibold underline">
            criar conta
          </Link>
          .
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="grid gap-6 md:grid-cols-5">
        <div className="space-y-3 md:col-span-3">
          <input
            className={cls}
            placeholder="Nome completo"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className={cls}
            type="email"
            placeholder="E-mail"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className={cls}
            placeholder="Telefone"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <div className="flex gap-2">
            <input
              className={cls}
              placeholder="CEP"
              value={form.postal_code}
              onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
              onBlur={fetchCep}
            />
            <Button type="button" variant="outline" onClick={fetchCep}>
              Buscar
            </Button>
          </div>
          <input
            className={cls}
            placeholder="Rua"
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className={cls}
              placeholder="Número"
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
            />
            <input
              className={cls}
              placeholder="Complemento"
              value={form.complement}
              onChange={(e) => setForm({ ...form, complement: e.target.value })}
            />
          </div>
          <input
            className={cls}
            placeholder="Bairro"
            value={form.neighborhood}
            onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className={cls}
              placeholder="Cidade"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <input
              className={cls}
              placeholder="UF"
              maxLength={2}
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
            />
          </div>
        </div>
        <div className="h-fit space-y-3 rounded-2xl border border-border bg-card p-5 md:col-span-2">
          <h2 className="font-semibold">Resumo</h2>
          {items.map((i) => (
            <div key={i.product_id} className="flex justify-between text-sm">
              <span className="mr-2 truncate">
                {i.quantity}x {i.name}
              </span>
              <span>{formatCurrency(i.price * i.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-2 text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Frete</span>
            <span>{shipping === 0 ? "Grátis" : formatCurrency(shipping)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
          <Button type="submit" className="w-full" disabled={loading || !user}>
            {loading ? "Gerando PIX..." : "Pagar com PIX"}
          </Button>
        </div>
      </form>
    </div>
  );
}
