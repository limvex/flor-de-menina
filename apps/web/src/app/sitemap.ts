import type { MetadataRoute } from 'next';

const SITE = 'https://flordemenina.store';

/** Servidor: rede Docker (http://api:3333). Build: evita HTTPS self-signed do proxy Coolify. */
function getApiBaseUrl(): string {
  const internal = process.env.INTERNAL_API_URL?.trim();
  if (internal) return internal;
  return process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:3333';
}

interface CategoryItem {
  slug: string;
  updatedAt?: string;
  children?: CategoryItem[];
}

interface ProductItem {
  slug: string;
  updatedAt: string;
}

// Tamanho máximo permitido por página na rota pública (DTO @Max(48)).
// Pagina-se até esgotar para suportar sitemaps com muitos produtos.
const PAGE_SIZE = 48;
const MAX_SITEMAP_PAGES = 100;

function flattenCategories(categories: CategoryItem[]): CategoryItem[] {
  const flat: CategoryItem[] = [];
  const stack = [...categories];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    flat.push({ slug: current.slug, updatedAt: current.updatedAt });
    if (Array.isArray(current.children) && current.children.length > 0) {
      stack.push(...current.children);
    }
  }

  return flat;
}

async function fetchAllProducts(apiBase: string): Promise<ProductItem[]> {
  const all: ProductItem[] = [];
  let page = 1;

  while (true) {
    const response = await fetch(`${apiBase}/products/public?limit=${PAGE_SIZE}&page=${page}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar produtos para sitemap (HTTP ${response.status})`);
    }

    const payload = await response.json();
    const items: ProductItem[] = payload?.items ?? [];
    all.push(...items);
    const totalPages = payload?.totalPages ?? 1;

    if (page >= totalPages || items.length === 0) break;
    page += 1;
    // Hard guard: no caso bizarro de loop infinito, encerra após 100 páginas.
    if (page > MAX_SITEMAP_PAGES) break;
  }

  return all;
}

/** Sitemap dinâmico: não pré-renderiza URLs da API no `next build` (API ausente ou TLS inválido). */
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${SITE}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE}/produtos`, changeFrequency: 'daily', priority: 0.9 },
  ];

  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return staticUrls;
  }

  const apiBase = getApiBaseUrl();

  try {
    const [products, categoriesResponse, instResponse] = await Promise.all([
      fetchAllProducts(apiBase),
      fetch(`${apiBase}/categories`, { next: { revalidate: 300 } }),
      fetch(`${apiBase}/pages`, { next: { revalidate: 300 } }),
    ]);

    if (!categoriesResponse.ok) {
      throw new Error(`Erro ao buscar categorias para sitemap (HTTP ${categoriesResponse.status})`);
    }

    const categoriesPayload = await categoriesResponse.json();
    const categoriesTree: CategoryItem[] = Array.isArray(categoriesPayload)
      ? categoriesPayload
      : (categoriesPayload?.items ?? []);
    const categories = flattenCategories(categoriesTree);

    const institutionalRaw: unknown = instResponse.ok ? await instResponse.json() : [];
    const institutional = Array.isArray(institutionalRaw) ? institutionalRaw : [];

    const categoryUrls: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${SITE}/categoria/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${SITE}/produto/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    const instUrls: MetadataRoute.Sitemap = institutional.map(
      (row: { slug: string; updatedAt?: string }) => ({
        url: `${SITE}/p/${row.slug}`,
        lastModified: row.updatedAt,
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      }),
    );

    return [...staticUrls, ...categoryUrls, ...productUrls, ...instUrls];
  } catch (error) {
    console.error('[sitemap] fallback para URLs estáticas:', error);
    return staticUrls;
  }
}
