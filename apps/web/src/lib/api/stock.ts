import { api } from './client';
import type {
  ProductWithStockSummary,
  VariantStockDetail,
  StockMovementHistoryItem,
} from '@flor/types';

export type StockStatusFilter = 'ok' | 'low' | 'out';
export type StockSortField = 'name' | 'stock' | 'updated';

export interface ListStockParams {
  search?: string;
  categoryId?: string;
  status?: StockStatusFilter;
  sort?: StockSortField;
  page?: number;
  pageSize?: number;
}

export interface StockListPage {
  items: ProductWithStockSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MovementHistoryPage {
  items: StockMovementHistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export type MovementType = 'IN' | 'OUT' | 'ADJUST';
export type MovementSource = 'MANUAL_IN' | 'MANUAL_ADJUST' | 'LOSS' | 'RETURN';

export interface CreateMovementPayload {
  variantId: string;
  type: MovementType;
  source: MovementSource;
  quantity: number;
  reason?: string;
  allowNegative?: boolean;
}

export interface CounterSalePayload {
  variantId: string;
  quantity: number;
  reason?: string;
  allowNegative?: boolean;
}

export interface ListMovementsParams {
  type?: string;
  source?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export const stockApi = {
  list: (params?: ListStockParams) => {
    const qs = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : '';
    return api.get<StockListPage>(`/admin/stock${qs}`);
  },

  getVariant: (variantId: string) =>
    api.get<VariantStockDetail>(`/admin/stock/variants/${variantId}`),

  listMovements: (variantId: string, params?: ListMovementsParams) => {
    const qs = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : '';
    return api.get<MovementHistoryPage>(`/admin/stock/variants/${variantId}/movements${qs}`);
  },

  createMovement: (payload: CreateMovementPayload) =>
    api.post<StockMovementHistoryItem>('/admin/stock/movements', payload),

  counterSale: (payload: CounterSalePayload) =>
    api.post<StockMovementHistoryItem>('/admin/stock/counter-sale', payload),
};
