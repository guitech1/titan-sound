"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatCpf, isValidCpf, maskCpfInput, stripCpf } from "@/lib/cpf";
import {
  calculateInstallments,
  formatDueDate,
  type InstallmentOption,
} from "@/lib/installments";
import { Check, Copy, Lock, ShieldCheck } from "lucide-react";
import { PixLogo } from "@/components/PixLogo";

type PaymentMethod = "pix" | "pix_installment";

export default function CheckoutPage() {
  const { items, getSubtotal, clear } = useCartStore();
  const user = useAuthStore((s) => s.user);
  const subtotal = getSubtotal();
  const shipping = subtotal >= 299 ? 0 : 25;
  const total = subtotal + shipping;

  const [step, setStep] = useState<1 | 2>(1); // 1 = dados, 2 = pagamento
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [installmentCount, setInstallmentCount] = useState<InstallmentOption>(2);

  const [pixResult, setPixResult] = useState<{
    type: "pix" | "pix_installment";
    order_number?: string;
    copy?: string;
    qr?: string;
    first?: {
      amount: number;
      number: number;
      totalParcels: number;
    };
    installments?: { number: number; amount: number; due_date: string }[];
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

  const [buyer, setBuyer] = useState({
    cpf: "",
    full_name: user?.full_name || "",
    birth_date: "",
  });

  const [cpfTouched, setCpfTouched] = useState(false);
  const cpfValid = isValidCpf(buyer.cpf);
  const cpfDigits = stripCpf(buyer.cpf);

  const installmentPreview = useMemo(() => {
    if (total <= 0) return null;
    try {
      return calculateInstallments(total, installmentCount, 0);
    } catch {
      return null;
    }
  }, [total, installmentCount]);

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

  const canGoToPayment =
    form.name.trim().length > 2 &&
    form.email.includes("@") &&
    form.phone.replace(/\D/g, "").length >= 10 &&
    form.postal_code.replace(/\D/g, "").length === 8 &&
    form.street.trim() &&
    form.number.trim() &&
    form.neighborhood.trim() &&
    form.city.trim() &&
    form.state.trim().length === 2;

  const canSubmitInstallment =
    cpfValid &&
    buyer.full_name.trim().split(" ").length >= 2 &&
    /^\d{2}\/\d{2}\/\d{4}$/.test(buyer.birth_date);

  const submit = async () => {
    if (!items.length) {
      setError("Carrinho vazio.");
      return;
    }
    if (!user) {
      setError("Faça login para finalizar a compra.");
      return;
    }
    if (!method) {
      setError("Selecione a forma de pagamento.");
      return;
    }
    if (method === "pix_installment" && !canSubmitInstallment) {
      setError("Preencha corretamente os dados de identificação.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload: Record<string, unknown> = {
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
        payment_method: method,
      };

      if (method === "pix_installment") {
        payload.installment_count = installmentCount;
        payload.buyer_cpf = cpfDigits;
        payload.buyer_full_name = buyer.full_name.trim();
        payload.buyer_birth_date = buyer.birth_date;
      }

      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

      if (data.payment_method === "pix_installment") {
        setPixResult({
          type: "pix_installment",
          order_number: data.order_number,
          copy: data.first_installment?.pix_copy_paste,
          qr: data.first_installment?.pix_qr_code_base64,
          first: {
            amount: data.first_installment?.amount,
            number: 1,
            totalParcels: data.installment_count,
          },
          installments: data.installments?.map(
            (i: { number: number; amount: number; due_date: string }) => ({
              number: i.number,
              amount: i.amount,
              due_date: i.due_date,
            })
          ),
        });
      } else {
        setPixResult({
          type: "pix",
          order_number: data.order_number,
          copy: data.pix_copy_paste,
          qr: data.pix_qr_code_base64,
        });
      }
      clear();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    }
    setLoading(false);
  };

  if (!items.length && !pixResult) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="mb-4 text-slate-400">Seu carrinho está vazio.</p>
        <Button asChild>
          <Link href="/produtos">Ver produtos</Link>
        </Button>
      </div>
    );
  }

  // ========== TELA DE PIX GERADO ==========
  if (pixResult) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {pixResult.type === "pix_installment"
                ? "1ª parcela gerada"
                : "PIX gerado"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Pedido {pixResult.order_number}
            </p>
          </div>
        </div>

        {pixResult.type === "pix_installment" && pixResult.first && (
          <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground">
              Parcela {pixResult.first.number} de {pixResult.first.totalParcels}
            </p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(pixResult.first.amount)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              As demais parcelas ficarão disponíveis na sua conta após a
              confirmação desta.
            </p>
          </div>
        )}

        {pixResult.qr && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={
              pixResult.qr.startsWith("data:")
                ? pixResult.qr
                : `data:image/png;base64,${pixResult.qr}`
            }
            alt="QR Code PIX"
            className="mx-auto mb-4 h-56 w-56 rounded-2xl bg-white p-3 shadow-lg shadow-black/20"
          />
        )}

        {pixResult.copy && (
          <div className="space-y-2">
            <textarea
              readOnly
              value={pixResult.copy}
              className="h-24 w-full rounded-xl border border-border bg-secondary/50 p-3 text-xs leading-relaxed"
            />
            <Button
              type="button"
              className="w-full"
              onClick={() => navigator.clipboard.writeText(pixResult.copy || "")}
            >
              <Copy className="h-4 w-4" />
              Copiar código PIX
            </Button>
          </div>
        )}

        {pixResult.installments && (
          <div className="mt-6 space-y-2 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cronograma de parcelas
            </p>
            {pixResult.installments.map((i) => (
              <div
                key={i.number}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {i.number}ª — venc. {formatDueDate(i.due_date)}
                </span>
                <span className="font-medium">{formatCurrency(i.amount)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Button asChild variant="outline" className="w-full">
            <Link href="/conta/parcelamentos">Acompanhar parcelas</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link href="/">Voltar à loja</Link>
          </Button>
        </div>
      </div>
    );
  }

  const inputCls =
    "h-11 w-full rounded-xl border border-border bg-secondary/40 px-3.5 text-sm transition-colors placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="container mx-auto px-4 py-8 pb-28 md:pb-12">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
            step >= 1 ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
          }`}
        >
          1
        </div>
        <span className={`text-sm font-medium ${step === 1 ? "text-foreground" : "text-muted-foreground"}`}>
          Dados
        </span>
        <div className="h-px flex-1 bg-border" />
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
            step >= 2 ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
          }`}
        >
          2
        </div>
        <span className={`text-sm font-medium ${step === 2 ? "text-foreground" : "text-muted-foreground"}`}>
          Pagamento
        </span>
      </div>

      <h1 className="mb-6 text-2xl font-bold tracking-tight">Checkout</h1>

      {!user && (
        <div className="mb-5 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Você precisa estar logado para finalizar a compra.{" "}
          <Link href="/auth/login?next=/checkout" className="font-semibold underline">
            Entrar
          </Link>{" "}
          ou{" "}
          <Link href="/auth/registro?next=/checkout" className="font-semibold underline">
            criar conta
          </Link>
          .
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Coluna principal */}
        <div className="space-y-6 lg:col-span-3">
          {step === 1 && (
            <section className="space-y-3 rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Dados e entrega
              </h2>
              <input
                className={inputCls}
                placeholder="Nome completo"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                className={inputCls}
                type="email"
                placeholder="E-mail"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                className={inputCls}
                placeholder="Telefone / WhatsApp"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <div className="flex gap-2">
                <input
                  className={inputCls}
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
                className={inputCls}
                placeholder="Rua"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inputCls}
                  placeholder="Número"
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                />
                <input
                  className={inputCls}
                  placeholder="Complemento"
                  value={form.complement}
                  onChange={(e) => setForm({ ...form, complement: e.target.value })}
                />
              </div>
              <input
                className={inputCls}
                placeholder="Bairro"
                value={form.neighborhood}
                onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={inputCls}
                  placeholder="Cidade"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
                <input
                  className={inputCls}
                  placeholder="UF"
                  maxLength={2}
                  value={form.state}
                  onChange={(e) =>
                    setForm({ ...form, state: e.target.value.toUpperCase() })
                  }
                />
              </div>

              <Button
                type="button"
                className="mt-2 w-full"
                size="lg"
                disabled={!canGoToPayment}
                onClick={() => setStep(2)}
              >
                Continuar para pagamento
              </Button>
            </section>
          )}

          {step === 2 && (
            <>
              {/* Seleção de método */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Forma de pagamento
                  </h2>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-primary hover:underline"
                  >
                    Editar dados
                  </button>
                </div>

                {/* Card PIX à vista */}
                <button
                  type="button"
                  onClick={() => setMethod("pix")}
                  className={`group relative flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
                    method === "pix"
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                      : "border-border bg-card/50 hover:border-primary/40 hover:bg-card"
                  }`}
                >
                  <PixLogo className="h-11 w-auto" size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">Pix à vista</p>
                      {method === "pix" && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Pagamento instantâneo e seguro
                    </p>
                    <p className="mt-1 text-lg font-bold text-primary">
                      {formatCurrency(total)}
                    </p>
                  </div>
                </button>

                {/* Card PIX Parcelado */}
                <button
                  type="button"
                  onClick={() => setMethod("pix_installment")}
                  className={`group relative flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
                    method === "pix_installment"
                      ? "border-emerald-500/60 bg-emerald-500/10 shadow-lg shadow-emerald-500/10"
                      : "border-border bg-card/50 hover:border-emerald-500/40 hover:bg-card"
                  }`}
                >
                  <div className="relative">
                    <PixLogo className="h-11 w-auto" size={44} />
                    <span className="absolute -right-1 -top-1 rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      4x
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">Pix Parcelado</p>
                      {method === "pix_installment" && (
                        <Check className="h-4 w-4 text-emerald-400" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Parcele sua compra em até 4x
                    </p>
                    <p className="mt-1 text-sm font-medium text-emerald-400">
                      A partir de {formatCurrency(total / 4)}
                    </p>
                  </div>
                </button>
              </section>

              {/* Formulário de identificação — apenas parcelado */}
              {method === "pix_installment" && (
                <section className="space-y-4 rounded-2xl border border-emerald-500/20 bg-card/60 p-5">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-semibold">Identificação e segurança</h3>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Seus dados são protegidos e utilizados exclusivamente para
                    registro e cobrança das parcelas deste pedido, conforme a
                    LGPD. O CPF é armazenado apenas em formato irreversível
                    (hash).
                  </p>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      CPF
                    </label>
                    <input
                      className={`${inputCls} ${cpfTouched && !cpfValid ? "border-destructive/60 focus:ring-destructive/30" : cpfValid ? "border-emerald-500/40" : ""}`}
                      placeholder="000.000.000-00"
                      inputMode="numeric"
                      value={buyer.cpf}
                      onChange={(e) => {
                        setBuyer({ ...buyer, cpf: maskCpfInput(e.target.value) });
                        setCpfTouched(true);
                      }}
                      onBlur={() => setCpfTouched(true)}
                    />
                    {cpfTouched && !cpfValid && cpfDigits.length === 11 && (
                      <p className="mt-1 text-xs text-destructive">CPF inválido</p>
                    )}
                    {cpfValid && (
                      <p className="mt-1 text-xs text-emerald-400">CPF válido</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Nome completo (como no CPF)
                    </label>
                    <input
                      className={inputCls}
                      placeholder="Nome e sobrenome"
                      value={buyer.full_name}
                      onChange={(e) =>
                        setBuyer({ ...buyer, full_name: e.target.value })
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      Data de nascimento
                    </label>
                    <input
                      className={inputCls}
                      placeholder="DD/MM/AAAA"
                      inputMode="numeric"
                      maxLength={10}
                      value={buyer.birth_date}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, "").slice(0, 8);
                        if (v.length > 4)
                          v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
                        else if (v.length > 2)
                          v = `${v.slice(0, 2)}/${v.slice(2)}`;
                        setBuyer({ ...buyer, birth_date: v });
                      }}
                    />
                  </div>

                  {/* Endereço reutilizado */}
                  <div className="rounded-xl border border-border/60 bg-secondary/30 p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">
                      Endereço de entrega (já informado)
                    </p>
                    <p className="text-sm">
                      {form.street}, {form.number}
                      {form.complement ? ` — ${form.complement}` : ""}
                      <br />
                      {form.neighborhood} · {form.city}/{form.state}
                      <br />
                      CEP {form.postal_code}
                    </p>
                  </div>

                  {/* Seleção de parcelas */}
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Escolha o número de parcelas
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {([2, 3, 4] as InstallmentOption[]).map((n) => {
                        const prev = calculateInstallments(total, n, 0);
                        const selected = installmentCount === n;
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setInstallmentCount(n)}
                            className={`rounded-xl border px-3 py-3 text-center transition-all ${
                              selected
                                ? "border-emerald-500 bg-emerald-500/15 shadow-md shadow-emerald-500/10"
                                : "border-border bg-secondary/30 hover:border-emerald-500/40"
                            }`}
                          >
                            <p className="text-lg font-bold">{n}x</p>
                            <p className="text-xs text-muted-foreground">
                              de {formatCurrency(prev.installmentAmount)}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {installmentPreview && (
                      <div className="mt-3 space-y-1.5 rounded-xl border border-border/50 bg-secondary/20 p-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total</span>
                          <span className="font-semibold">
                            {formatCurrency(installmentPreview.totalWithInterest)}
                          </span>
                        </div>
                        {installmentPreview.dueDates.map((d, idx) => (
                          <div key={d} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              {idx + 1}ª parcela — {formatDueDate(d)}
                            </span>
                            <span>
                              {formatCurrency(
                                calculateInstallments(total, installmentCount, 0)
                                  .installmentAmount
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              )}

              <Button
                type="button"
                size="lg"
                className="w-full"
                disabled={
                  loading ||
                  !user ||
                  !method ||
                  (method === "pix_installment" && !canSubmitInstallment)
                }
                onClick={submit}
              >
                {loading
                  ? "Processando..."
                  : method === "pix_installment"
                    ? `Confirmar parcelamento em ${installmentCount}x`
                    : "Gerar PIX"}
              </Button>
            </>
          )}
        </div>

        {/* Resumo */}
        <aside className="h-fit space-y-3 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-6 lg:col-span-2">
          <h2 className="font-semibold">Resumo do pedido</h2>
          {items.map((i) => (
            <div key={i.product_id} className="flex justify-between text-sm">
              <span className="mr-2 truncate text-muted-foreground">
                {i.quantity}x {i.name}
              </span>
              <span>{formatCurrency(i.price * i.quantity)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-border pt-2 text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Frete</span>
            <span>{shipping === 0 ? "Grátis" : formatCurrency(shipping)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>

          {method === "pix_installment" && installmentPreview && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm">
              <p className="text-xs text-muted-foreground">No Pix Parcelado</p>
              <p className="font-semibold text-emerald-400">
                {installmentCount}x de{" "}
                {formatCurrency(installmentPreview.installmentAmount)}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Pagamento seguro · Dados protegidos
          </div>
        </aside>
      </div>
    </div>
  );
}
