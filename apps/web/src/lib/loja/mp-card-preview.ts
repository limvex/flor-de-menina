/** Pré-visualização do cartão a partir do BIN (callback `onBinChange` do Card Payment Brick). */

export function formatMaskedPanFromBin(bin: string): string {
  const d = (bin || '').replace(/\D/g, '').slice(0, 8);
  if (!d) return '•••• •••• •••• ••••';
  const g1 = d.slice(0, 4).padEnd(4, '•');
  const g2 = d.slice(4, 8).padEnd(4, '•');
  return `${g1} ${g2} •••• ••••`;
}

/** Heurística simples por IIN (cartões de teste MP costumam começar por 5031 etc.). */
export function brandLabelFromBin(bin: string): string {
  const d = (bin || '').replace(/\D/g, '');
  if (!d) return 'CARTÃO';
  if (d.startsWith('4')) return 'VISA';
  // BINs de teste MP (ex.: 5031…) e Maestro podem começar fora de 51–55; tratar 5xxxx como Mastercard na prévia.
  if (/^5/.test(d)) return 'MASTERCARD';
  if (/^3[47]/.test(d)) return 'AMEX';
  return 'CARTÃO';
}
