import { api } from './client';

export interface ProductImage {
  id: string;
  url: string;
  thumbUrl?: string;
  cardUrl?: string;
  alt?: string;
  position: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size?: string;
  color?: string;
  colorHex?: string;
  price?: number;
  stock: number;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription?: string;
  basePrice: number;
  compareAtPrice?: number;
  categoryId: string;
  category?: Category;
  isActive: boolean;
  isFeatured: boolean;
  weight?: number;
  width?: number;
  height?: number;
  length?: number;
  seoTitle?: string;
  seoDescription?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  totalStock?: number;
  createdAt: string;
  deletedAt?: string;
}

export interface ProductsPage {
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  outOfStock: number;
}

export interface ListProductsParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  stock?: 'available' | 'out_of_stock' | 'all';
  sortBy?: 'createdAt' | 'name' | 'basePrice';
  sortOrder?: 'asc' | 'desc';
}

function toQuery(params: Record<string, unknown>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `?${qs}` : '';
}

export const productsApi = {
  list: (params: ListProductsParams = {}) =>
    api.get<ProductsPage>(`/products${toQuery(params as Record<string, unknown>)}`),

  stats: () => api.get<ProductStats>('/products/stats'),

  getById: (id: string) => api.get<Product>(`/products/${id}`),

  create: (data: Partial<Product>) => api.post<Product>('/products', data),

  update: (id: string, data: Partial<Product>) => api.patch<Product>(`/products/${id}`, data),

  delete: (id: string) => api.delete(`/products/${id}`),

  restore: (id: string) => api.post(`/products/${id}/restore`),

  upsertVariants: (id: string, variants: Partial<ProductVariant>[]) =>
    api.put<Product>(`/products/${id}/variants`, { variants }),

  bulkSetActive: (ids: string[], active: boolean) =>
    api.post('/products/bulk/set-active', { ids, active }),

  // Público
  listPublic: (params: Record<string, unknown> = {}) =>
    api.get<ProductsPage>(`/products/public${toQuery(params)}`),

  getBySlug: (slug: string) => api.get<Product>(`/products/public/${slug}`),
};
