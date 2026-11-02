/**
 * Cálculo de parcelas internas da Titan Sound.
 * Juros simples mensais configuráveis (padrão 0%).
 */

export type InstallmentOption = 2 | 3 | 4;

export interface InstallmentPreview {
  count: InstallmentOption;
  totalWithInterest: number;
  installmentAmount: number;
  interestTotal: number;
  dueDates: string[]; // ISO date YYYY-MM-DD
}

/** Taxa de juros mensal padrão (0 = sem juros). Pode ser alterada em config. */
export const DEFAULT_MONTHLY_INTEREST_RATE = 0;

/**
 * Calcula o valor de cada parcela e as datas de vencimento.
 * 1ª parcela vence em D+0 (hoje), demais de 30 em 30 dias.
 */
export function calculateInstallments(
  principal: number,
  count: InstallmentOption,
  monthlyRate: number = DEFAULT_MONTHLY_INTEREST_RATE,
  startDate: Date = new Date()
): InstallmentPreview {
  if (principal <= 0 || ![2, 3, 4].includes(count)) {
    throw new Error("Parâmetros de parcelamento inválidos");
  }

  // Juros simples sobre o principal por (count-1) períodos médios simplificado
  // ou juros compostos simples por parcela — usamos total = principal * (1 + rate * (count-1)/2) aproximado
  // Para clareza e previsibilidade: juros lineares mensais sobre o principal
  const interestTotal =
    monthlyRate > 0 ? Number((principal * monthlyRate * (count - 1)).toFixed(2)) : 0;
  const totalWithInterest = Number((principal + interestTotal).toFixed(2));

  // Distribui o valor total em parcelas iguais (última ajusta centavos)
  const base = Math.floor((totalWithInterest * 100) / count) / 100;
  const amounts: number[] = Array(count).fill(base);
  const sumBase = base * count;
  const diff = Number((totalWithInterest - sumBase).toFixed(2));
  amounts[count - 1] = Number((base + diff).toFixed(2));

  const dueDates: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i * 30);
    dueDates.push(d.toISOString().slice(0, 10));
  }

  return {
    count,
    totalWithInterest,
    installmentAmount: amounts[0], // valor de referência (pode haver ajuste de centavos na última)
    interestTotal,
    dueDates,
  };
}

/** Retorna o array completo de valores por parcela (com ajuste de centavos). */
export function getInstallmentAmounts(
  principal: number,
  count: InstallmentOption,
  monthlyRate: number = DEFAULT_MONTHLY_INTEREST_RATE
): number[] {
  const { totalWithInterest } = calculateInstallments(principal, count, monthlyRate);
  const base = Math.floor((totalWithInterest * 100) / count) / 100;
  const amounts = Array(count).fill(base) as number[];
  const diff = Number((totalWithInterest - base * count).toFixed(2));
  amounts[count - 1] = Number((base + diff).toFixed(2));
  return amounts;
}

export function formatDueDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}
