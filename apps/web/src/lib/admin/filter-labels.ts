/** Labels PT-BR para valores de filtro da API (o valor enviado permanece em inglês). */

export const PRODUCT_STATUS_FILTER_LABELS: Record<string, string> = {
  all: 'Todos',
  active: 'Ativos',
  inactive: 'Inativos',
};

export const PRODUCT_STOCK_FILTER_LABELS: Record<string, string> = {
  all: 'Todo estoque',
  available: 'Com estoque',
  out_of_stock: 'Esgotado',
};

export function getProductStatusFilterLabel(value: string | undefined): string {
  if (!value || value === 'all') return PRODUCT_STATUS_FILTER_LABELS.all;
  return PRODUCT_STATUS_FILTER_LABELS[value] ?? value;
}

export function getProductStockFilterLabel(value: string | undefined): string {
  if (!value || value === 'all') return PRODUCT_STOCK_FILTER_LABELS.all;
  return PRODUCT_STOCK_FILTER_LABELS[value] ?? value;
}

export function getCategoryFilterLabel(
  categoryId: string | undefined,
  categories: { id: string; name: string }[],
): string {
  if (!categoryId || categoryId === 'all') return 'Todas categorias';
  return categories.find((c) => c.id === categoryId)?.name ?? 'Todas categorias';
}
