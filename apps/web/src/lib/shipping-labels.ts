export const SHIPPING_SERVICE_LABELS: Record<string, string> = {
  '.Package': 'Jadlog Econômico',
  '.Com': 'Jadlog Expresso',
  PAC: 'PAC — Correios',
  SEDEX: 'SEDEX — Correios',
  'SEDEX 10': 'SEDEX 10 — Correios',
  'SEDEX 12': 'SEDEX 12 — Correios',
  Econômico: 'Econômico',
  Expresso: 'Expresso',
};

export function getShippingLabel(service: string): string {
  return SHIPPING_SERVICE_LABELS[service] ?? service;
}
