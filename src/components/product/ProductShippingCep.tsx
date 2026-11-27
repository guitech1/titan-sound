"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  calculateShipping,
  FREE_SHIPPING_THRESHOLD,
} from "@/lib/shipping";
import { MapPin } from "lucide-react";

export function ProductShippingCep({ productPrice }: { productPrice: number }) {
  const [cep, setCep] = useState("");
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<ReturnType<typeof calculateShipping> | null>(null);

  const handleConsult = async () => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setError("Informe um CEP válido com 8 dígitos.");
      return;
    }
    setLoading(true);
    setError("");
    setAddress(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setError("CEP não encontrado.");
        setQuote(null);
      } else {
        const loc = [data.logradouro, data.bairro, data.localidade, data.uf]
          .filter(Boolean)
          .join(" — ");
        setAddress(loc || `${data.localidade}/${data.uf}`);
        setQuote(calculateShipping(productPrice));
      }
    } catch {
      setError("Não foi possível consultar o CEP. Tente novamente.");
      setQuote(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-xs font-medium text-muted-foreground">
        Consultar condições de entrega
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="00000-000"
          maxLength={9}
          value={cep}
          onChange={(e) => {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5, 8);
            setCep(v);
          }}
          className="h-10 flex-1 rounded-xl border border-border bg-secondary/40 px-3 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={handleConsult}
          disabled={loading}
          className="h-10 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "..." : "OK"}
        </button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {address && quote && (
        <div className="rounded-xl border border-border bg-secondary/20 p-3 text-sm space-y-1">
          <p className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {address}
          </p>
          <p>
            Frete:{" "}
            <strong className={quote.isFree ? "text-emerald-400" : ""}>
              {quote.isFree ? "Grátis" : formatCurrency(quote.cost)}
            </strong>
          </p>
          <p className="text-muted-foreground">{quote.estimatedLabel}</p>
          {!quote.isFree && (
            <p className="text-xs text-amber-200/80">
              Frete grátis em compras a partir de {formatCurrency(FREE_SHIPPING_THRESHOLD)}.
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Valores e prazos são estimativas comerciais da loja (não cotação em tempo real com transportadoras).
          </p>
        </div>
      )}
    </div>
  );
}
