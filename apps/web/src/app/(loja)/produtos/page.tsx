import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/loja/breadcrumbs';
import { ProductGridSkeleton } from '@/components/loja/product-skeleton';
import { CatalogClient } from './catalog-client';

export const metadata: Metadata = {
  title: 'Todos os produtos | Flor de Menina',
  description:
    'Vestidos, blusas, calças, bolsas e acessórios de moda feminina. Descubra peças clássicas, chic e cool da Flor de Menina.',
  openGraph: {
    title: 'Todos os produtos | Flor de Menina',
    description: 'Moda feminina atemporal — Flor de Menina.',
    type: 'website',
  },
};

export default function ProdutosPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
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
