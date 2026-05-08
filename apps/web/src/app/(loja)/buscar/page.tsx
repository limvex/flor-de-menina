import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/loja/breadcrumbs';
import { ProductGridSkeleton } from '@/components/loja/product-skeleton';
import { CatalogClient } from '@/app/(loja)/produtos/catalog-client';

export const metadata: Metadata = {
  robots: 'noindex',
};

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function BuscarPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const term = q?.trim() ?? '';

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Breadcrumbs items={[{ label: 'Busca' }]} />
        <h1 className="mt-4 font-serif text-3xl text-stone-900">
          {term ? `Resultados para "${term}"` : 'Buscar produtos'}
        </h1>
      </div>
      <Suspense fallback={<ProductGridSkeleton count={8} />}>
        <CatalogClient initialSearch={term || undefined} />
      </Suspense>
    </main>
  );
}
