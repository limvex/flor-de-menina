import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/loja/breadcrumbs';
import { ProductGridSkeleton } from '@/components/loja/product-skeleton';
import { CatalogClient } from './catalog-client';
import { listPublicProducts } from '@/lib/api/products-public';

const SITE = 'https://flordemenina.store';

export const metadata: Metadata = {
  title: 'Todos os produtos | Flor de Menina',
  description:
    'Vestidos, blusas, calças, bolsas e acessórios de moda feminina. Descubra peças clássicas, chic e cool da Flor de Menina.',
  openGraph: {
    title: 'Todos os produtos | Flor de Menina',
    description: 'Moda feminina atemporal — Flor de Menina.',
    type: 'website',
  },
  alternates: { canonical: '/produtos' },
};

export default async function ProdutosPage() {
  // Pré-carrega produtos da primeira página apenas para gerar JSON-LD ItemList no SSR.
  // O catálogo continua sendo client-side via CatalogClient (filtros, paginação dinâmica).
  let initial: Awaited<ReturnType<typeof listPublicProducts>> | null = null;
  try {
    initial = await listPublicProducts({ page: 1, limit: 24, sort: 'relevance' });
  } catch {
    initial = null;
  }

  const itemListJsonLd = initial
    ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: initial.items.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE}/produto/${p.slug}`,
          name: p.name,
        })),
      }
    : null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}
      <div className="mb-6">
        <Breadcrumbs items={[{ label: 'Produtos' }]} />
        <h1 className="mt-4 font-serif text-3xl text-stone-900">Todos os produtos</h1>
      </div>
      <Suspense fallback={<ProductGridSkeleton count={8} />}>
        <CatalogClient />
      </Suspense>
    </main>
  );
}
