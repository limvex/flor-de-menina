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

// Tamanho máximo permitido por página na rota pública (DTO @Max(48)).
// Pagina-se até esgotar para suportar sitemaps com muitos produtos.
const PAGE_SIZE = 48;

async function fetchAllProducts(): Promise<ProductItem[]> {
  const all: ProductItem[] = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${API_URL}/products/public?limit=${PAGE_SIZE}&page=${page}`).then(
      (r) => r.json(),
    );
    const items: ProductItem[] = res?.items ?? [];
    all.push(...items);
    const totalPages = res?.totalPages ?? 1;
    if (page >= totalPages || items.length === 0) break;
    page += 1;
    // Hard guard: no caso bizarro de loop infinito, encerra após 100 páginas.
    if (page > 100) break;
  }
  return all;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE}/produtos`, changeFrequency: 'daily', priority: 0.9 },
  ];

  try {
    const [products, categoriesRes] = await Promise.all([
      fetchAllProducts(),
      fetch(`${API_URL}/categories`).then((r) => r.json()),
    ]);

    const categories: CategoryItem[] = Array.isArray(categoriesRes)
      ? categoriesRes
      : (categoriesRes?.items ?? []);

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
