export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'newest', label: 'Mais recentes' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'bestselling', label: 'Mais vendidos' },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]['value'];
