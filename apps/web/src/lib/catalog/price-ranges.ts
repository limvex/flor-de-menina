export const PRICE_RANGES = [
  { label: 'Até R$ 199', min: 0, max: 199 },
  { label: 'R$ 200 a 399', min: 200, max: 399 },
  { label: 'R$ 400 a 599', min: 400, max: 599 },
  { label: 'R$ 600 a 999', min: 600, max: 999 },
  { label: 'Acima de R$ 1.000', min: 1000, max: null },
] as const;

export type PriceRange = (typeof PRICE_RANGES)[number];
