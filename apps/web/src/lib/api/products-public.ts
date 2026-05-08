const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export interface PublicProduct {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  compareAtPrice: number | null;
  primaryImage: string | null;
  secondaryImage: string | null;
  isOutOfStock: boolean;
  isLastPiece: boolean;
  isNew: boolean;
  availableColors: string[];
  category: { id: string; name: string; slug: string };
  createdAt: string;
  updatedAt: string;
}

export interface ProductListResponse {
  items: PublicProduct[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CatalogFilters {
  page?: number;
  limit?: number;
  search?: string;
  categorySlug?: string;
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}

export interface Facets {
  sizes: string[];
  colors: { name: string; hex: string }[];
  priceMin: number;
  priceMax: number;
}

export async function listPublicProducts(filters: CatalogFilters): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.categorySlug) params.set('categorySlug', filters.categorySlug);
  if (filters.sizes?.length) filters.sizes.forEach((s) => params.append('sizes', s));
  if (filters.colors?.length) filters.colors.forEach((c) => params.append('colors', c));
  if (filters.minPrice != null) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice != null) params.set('maxPrice', String(filters.maxPrice));
  if (filters.sort) params.set('sort', filters.sort);

  const res = await fetch(`${API_URL}/products/public?${params}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error('Erro ao buscar produtos');
  return res.json() as Promise<ProductListResponse>;
}

export async function getPublicFacets(categorySlug?: string): Promise<Facets> {
  const params = categorySlug ? `?categorySlug=${categorySlug}` : '';
  const res = await fetch(`${API_URL}/products/public/facets${params}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error('Erro ao buscar facets');
  return res.json() as Promise<Facets>;
}
