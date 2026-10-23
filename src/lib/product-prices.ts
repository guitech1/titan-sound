/**
 * Normalize product price fields for Supabase insert/update.
 * Constraint: compare_at_price IS NULL OR compare_at_price >= 0
 * Business: if set, compare_at_price must be > price (strikethrough price).
 */

export function parseOptionalPrice(value: string | number | null | undefined): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return n;
}

export function normalizeCompareAtPrice(
  raw: string | number | null | undefined,
  price: number
): { value: number | null; error?: string } {
  const parsed = parseOptionalPrice(raw);

  if (parsed === null) {
    return { value: null };
  }

  if (parsed < 0) {
    return {
      value: null,
      error: "O preço comparado não pode ser negativo.",
    };
  }

  if (parsed > 0 && parsed <= price) {
    return {
      value: null,
      error: "O preço comparado (riscado) deve ser maior que o preço de venda.",
    };
  }

  if (parsed === 0) {
    return { value: null };
  }

  return { value: parsed };
}

export function normalizePrice(raw: string | number | null | undefined): {
  value: number | null;
  error?: string;
} {
  const parsed = parseOptionalPrice(raw);
  if (parsed === null || parsed <= 0) {
    return { value: null, error: "Informe um preço de venda válido maior que zero." };
  }
  return { value: parsed };
}
