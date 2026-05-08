import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/loja/breadcrumbs';
import { ProductGridSkeleton } from '@/components/loja/product-skeleton';
import { CatalogClient } from '@/app/(loja)/produtos/catalog-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  seoTitle?: string;
  seoDescription?: string;
}

async function fetchCategory(slug: string): Promise<CategoryData | null> {
  try {
    const res = await fetch(`${API_URL}/categories/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json() as Promise<CategoryData>;
  } catch {
    return null;
  }
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  if (!category) return { title: 'Categoria não encontrada | Flor de Menina' };
  return {
    title: `${category.seoTitle ?? category.name} | Flor de Menina`,
    description:
      category.seoDescription ??
      `Compre ${category.name.toLowerCase()} da Flor de Menina. Moda feminina atemporal.`,
    openGraph: {
      title: `${category.name} | Flor de Menina`,
      type: 'website',
    },
    alternates: { canonical: `/categoria/${slug}` },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await fetchCategory(slug);
  if (!category) notFound();

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Breadcrumbs items={[{ label: 'Produtos', href: '/produtos' }, { label: category.name }]} />
        <h1 className="mt-4 font-serif text-3xl text-stone-900">{category.name}</h1>
      </div>
      <Suspense fallback={<ProductGridSkeleton count={8} />}>
        <CatalogClient initialCategorySlug={slug} />
      </Suspense>
    </main>
  );
}
