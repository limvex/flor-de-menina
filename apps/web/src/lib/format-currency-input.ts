/** Formata dígitos brutos como moeda BRL (centavos → reais). */
export function formatCurrencyInput(rawDigits: string): string {
  const digits = rawDigits.replace(/\D/g, '');
  if (!digits) return '';
  const number = Number(digits) / 100;
  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/** Extrai valor numérico em reais a partir do display formatado. */
export function parseCurrencyInput(display: string): number {
  const digits = display.replace(/\D/g, '');
  return digits ? Number(digits) / 100 : 0;
}
