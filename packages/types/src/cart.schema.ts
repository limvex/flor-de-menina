export const FREE_SHIPPING_THRESHOLD = 299;
export const CART_RESERVATION_MINUTES = 15;

export interface CartItemProductInfo {
  id: string;
  name: string;
  slug: string;
  image: string;
}

export interface CartItemVariantInfo {
  id: string;
  size: string | null;
  color: string | null;
  label: string;
  price: number;
  compareAtPrice: number | null;
}

export interface CartItemResponse {
  id: string;
  variantId: string;
  quantity: number;
  reservedUntil: string | null;
  product: CartItemProductInfo;
  variant: CartItemVariantInfo;
  availableStock: number;
}

export interface CartResponse {
  id: string;
  items: CartItemResponse[];
  subtotal: number;
  itemCount: number;
  nextExpiry: string | null;
  /** Valor mínimo do pedido para frete grátis (global). `null` = desativado no admin. */
  freeShippingThreshold: number | null;
  /** Quanto falta para o frete grátis; `null` se a meta estiver desativada. */
  freeShippingRemaining: number | null;
}

export interface MergeDiscardedItem {
  variantId: string;
  reason: 'out_of_stock' | 'capped';
}

export interface MergeCartResponse {
  cart: CartResponse;
  discarded: MergeDiscardedItem[];
}

export interface LocalCartItem {
  variantId: string;
  quantity: number;
}
