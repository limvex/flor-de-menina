import { api } from './client';
import type { WishlistItem } from '@flor/types';

export interface WishlistIdsResponse {
  ids: string[];
}

export async function getWishlistIds(): Promise<string[]> {
  try {
    const data = await api.get<WishlistIdsResponse>('/wishlist/ids');
    return data.ids;
  } catch {
    return [];
  }
}

export async function getWishlist(): Promise<WishlistItem[]> {
  try {
    return api.get<WishlistItem[]>('/wishlist');
  } catch {
    return [];
  }
}

export async function addToWishlist(productId: string, variantId?: string) {
  return api.post('/wishlist', { productId, variantId });
}

export async function removeFromWishlist(productId: string) {
  return api.delete(`/wishlist/${productId}`);
}
