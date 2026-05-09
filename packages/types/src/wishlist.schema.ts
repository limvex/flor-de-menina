export interface WishlistProductImage {
  url: string;
  thumbUrl: string | null;
  cardUrl: string | null;
}

export interface WishlistItemVariant {
  id: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
}

export interface WishlistProduct {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  compareAtPrice: number | null;
  isActive: boolean;
  totalStock: number;
  primaryImage: string | null;
  secondaryImage: string | null;
  images: WishlistProductImage[];
  category: { name: string; slug: string };
}

export interface WishlistItem {
  id: string;
  wishlistId: string;
  productId: string;
  variantId: string | null;
  createdAt: string;
  product: WishlistProduct;
  variant: WishlistItemVariant | null;
}

export interface WishlistResponse {
  items: WishlistItem[];
}
