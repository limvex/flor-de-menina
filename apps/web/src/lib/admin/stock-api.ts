import type { ProductWithStockSummary, VariantStockDetail } from '@flor/types';
import type {
  StockListPage,
  MovementHistoryPage,
  ListStockParams,
  ListMovementsParams,
} from '@/lib/api/stock';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

function hdrs(token: string): HeadersInit {
  return { Cookie: `access_token=${token}` };
}

export async function fetchStockList(
  token: string,
  params?: ListStockParams,
): Promise<StockListPage> {
  const qs = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';
  const res = await fetch(`${API}/admin/stock${qs}`, {
    headers: hdrs(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Erro ao buscar estoque');
  return res.json();
}

export async function fetchVariantStock(
  token: string,
  variantId: string,
): Promise<VariantStockDetail> {
  const res = await fetch(`${API}/admin/stock/variants/${variantId}`, {
    headers: hdrs(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Variante não encontrada');
  return res.json();
}

export async function fetchVariantMovements(
  token: string,
  variantId: string,
  params?: ListMovementsParams,
): Promise<MovementHistoryPage> {
  const qs = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v != null)
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';
  const res = await fetch(`${API}/admin/stock/variants/${variantId}/movements${qs}`, {
    headers: hdrs(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Erro ao buscar histórico');
  return res.json();
}

export async function fetchProductVariantForStock(
  token: string,
  variantId: string,
): Promise<VariantStockDetail> {
  return fetchVariantStock(token, variantId);
}
