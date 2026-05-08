import { api } from './client';
import type { CartResponse, MergeCartResponse, LocalCartItem } from '@flor/types';

export async function getCart(): Promise<CartResponse> {
  return api.get<CartResponse>('/cart');
}

export async function addCartItem(variantId: string, quantity: number): Promise<CartResponse> {
  return api.post<CartResponse>('/cart/items', { variantId, quantity });
}

export async function updateCartItem(variantId: string, quantity: number): Promise<CartResponse> {
  return api.patch<CartResponse>(`/cart/items/${variantId}`, { quantity });
}

export async function removeCartItem(variantId: string): Promise<CartResponse> {
  return api.delete<CartResponse>(`/cart/items/${variantId}`);
}

export async function clearCartApi(): Promise<void> {
  return api.delete<void>('/cart');
}

export async function mergeCart(items: LocalCartItem[]): Promise<MergeCartResponse> {
  return api.post<MergeCartResponse>('/cart/merge', { items });
}
