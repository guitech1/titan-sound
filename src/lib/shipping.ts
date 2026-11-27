/**
 * Regras comerciais de frete da Titan Sound.
 * - Subtotal (após descontos) < R$ 250,00 → frete R$ 11,79
 * - Subtotal >= R$ 250,00 → frete grátis
 * - Prazo estimado: 6 a 15 dias úteis (estimativa comercial, não cotação em tempo real)
 */

export const FREE_SHIPPING_THRESHOLD = 250;
export const FIXED_SHIPPING_COST = 11.79;
export const ESTIMATED_DELIVERY_MIN_DAYS = 6;
export const ESTIMATED_DELIVERY_MAX_DAYS = 15;

export interface ShippingQuote {
  cost: number;
  isFree: boolean;
  threshold: number;
  remainingForFree: number;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  label: string;
  estimatedLabel: string;
}

/**
 * Calcula frete com base no subtotal dos produtos após descontos (antes do frete).
 * Deve ser usado tanto no frontend (preview) quanto no backend (valor definitivo).
 */
export function calculateShipping(subtotalAfterDiscount: number): ShippingQuote {
  const safe = Math.max(0, Number(subtotalAfterDiscount) || 0);
  const isFree = safe >= FREE_SHIPPING_THRESHOLD;
  const cost = isFree ? 0 : FIXED_SHIPPING_COST;
  const remainingForFree = isFree
    ? 0
    : Number(Math.max(0, FREE_SHIPPING_THRESHOLD - safe).toFixed(2));

  return {
    cost: Number(cost.toFixed(2)),
    isFree,
    threshold: FREE_SHIPPING_THRESHOLD,
    remainingForFree,
    estimatedMinDays: ESTIMATED_DELIVERY_MIN_DAYS,
    estimatedMaxDays: ESTIMATED_DELIVERY_MAX_DAYS,
    label: isFree ? "Frete grátis" : `Frete: R$ ${FIXED_SHIPPING_COST.toFixed(2).replace(".", ",")}`,
    estimatedLabel: `Prazo estimado: ${ESTIMATED_DELIVERY_MIN_DAYS} a ${ESTIMATED_DELIVERY_MAX_DAYS} dias`,
  };
}

export function freeShippingProgressMessage(subtotalAfterDiscount: number): string {
  const quote = calculateShipping(subtotalAfterDiscount);
  if (quote.isFree) {
    return "Parabéns! Seu pedido ganhou frete grátis.";
  }
  return `Faltam R$ ${quote.remainingForFree
    .toFixed(2)
    .replace(".", ",")} para ganhar frete grátis!`;
}
