export const LOW_STOCK_THRESHOLD = 5;

export type StockMovementType = 'IN' | 'OUT' | 'ADJUST';

export type StockMovementSource =
  | 'MANUAL_IN'
  | 'MANUAL_ADJUST'
  | 'COUNTER_SALE'
  | 'ONLINE_ORDER'
  | 'ORDER_CANCELLED'
  | 'ORDER_REFUNDED'
  | 'LOSS'
  | 'RETURN';

export type StockStatus = 'ok' | 'low' | 'out';

export interface ProductWithStockSummary {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  thumbUrl: string | null;
  totalStock: number;
  status: StockStatus;
  variants: VariantStockSummary[];
  updatedAt: string;
}

export interface VariantStockSummary {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  stock: number;
  status: StockStatus;
  isActive: boolean;
}

export interface VariantStockDetail extends VariantStockSummary {
  productId: string;
  productName: string;
  recentMovements: StockMovementHistoryItem[];
}

export interface StockMovementHistoryItem {
  id: string;
  type: StockMovementType;
  source: StockMovementSource;
  quantity: number;
  stockBefore: number;
  stockAfter: number;
  reason: string | null;
  orderId: string | null;
  userId: string | null;
  userName: string | null;
  createdAt: string;
}
