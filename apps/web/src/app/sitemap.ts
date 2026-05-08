import type { MetadataRoute } from 'next';

const SITE = 'https://flordemenina.site';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

interface CategoryItem {
  slug: string;
}

interface ProductItem {
  slug: string;
  updatedAt: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE}/produtos`, changeFrequency: 'daily', priority: 0.9 },
  ];

  try {
    const [productsRes, categoriesRes] = await Promise.all([
      fetch(`${API_URL}/products/public?limit=1000`).then((r) => r.json()),
      fetch(`${API_URL}/categories`).then((r) => r.json()),
    ]);

    const categories: CategoryItem[] = Array.isArray(categoriesRes)
      ? categoriesRes
      : (categoriesRes?.items ?? []);
    const products: ProductItem[] = productsRes?.items ?? [];

    const categoryUrls: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${SITE}/categoria/${c.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

    const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${SITE}/produto/${p.slug}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...staticUrls, ...categoryUrls, ...productUrls];
  } catch {
    return staticUrls;
  }
}
