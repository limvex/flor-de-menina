const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export interface ProductVariant {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  colorHex: string | null;
  price: number;
  stock: number;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  thumbUrl: string | null;
  cardUrl: string | null;
  fullUrl: string | null;
  alt: string | null;
  position: number;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  sizeChart: {
    title: string;
    columnHeader: string;
    columns: string[];
    rows: { label: string; values: string[] }[];
  } | null;
}

export interface ProductDetail {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  basePrice: number;
  compareAtPrice: number | null;
  isOutOfStock: boolean;
  isLastPiece: boolean;
  isNew: boolean;
  isFeatured: boolean;
  weight: number | null;
  width: number | null;
  height: number | null;
  length: number | null;
  seoTitle: string | null;
  seoDescription: string | null;
  totalStock: number;
  category: ProductCategory;
  images: ProductImage[];
  variants: ProductVariant[];
  relatedProducts: RelatedProduct[];
}

export interface RelatedProduct {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  compareAtPrice: number | null;
  primaryImage: string | null;
  secondaryImage: string | null;
  availableColors: { name: string; hex: string }[];
  totalStock: number;
  isOutOfStock: boolean;
  isLastPiece: boolean;
  isNew: boolean;
  category: { name: string; slug: string };
}

export async function getProductBySlug(slug: string): Promise<ProductDetail> {
  const res = await fetch(`${API_URL}/products/public/${slug}`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error('NOT_FOUND');
    throw new Error('FETCH_ERROR');
  }

  return res.json() as Promise<ProductDetail>;
}
