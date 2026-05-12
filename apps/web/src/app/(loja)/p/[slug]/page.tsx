import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/loja/breadcrumbs';
import { fetchInstitutionalPageBySlug } from '@/lib/api/institutional-pages-public';

/** Conteúdo vem do admin — sem ISR/cache para ativo/inativo refletir na hora ao navegar. */
export const dynamic = 'force-dynamic';

const SITE = 'https://flordemenina.store';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchInstitutionalPageBySlug(slug);
  if (!page) {
    return { title: { absolute: 'Página não encontrada | Flor de Menina' } };
  }
  const title = page.metaTitle?.trim() || page.title;
  const description = page.metaDescription?.trim() || undefined;
  return {
    title,
    description,
    openGraph: {
      title: page.metaTitle?.trim() || page.title,
      description,
      type: 'article',
      url: `${SITE}/p/${page.slug}`,
      images: page.ogImage ? [{ url: page.ogImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle?.trim() || page.title,
      description,
      images: page.ogImage ? [page.ogImage] : undefined,
    },
    alternates: { canonical: `/p/${page.slug}` },
  };
}

export default async function PaginaInstitucionalPublica({ params }: Props) {
  const { slug } = await params;
  const page = await fetchInstitutionalPageBySlug(slug);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8">
      <Breadcrumbs items={[{ label: page.title }]} />
      <h1 className="mt-6 font-serif text-3xl sm:text-4xl font-medium text-flor-900 tracking-tight">
        {page.title}
      </h1>
      <div className="mt-4 h-px w-24 bg-flor-200" aria-hidden />
      <div
        className="prose prose-stone prose-lg max-w-none mt-8 prose-headings:font-serif prose-a:text-flor-600 prose-a:underline-offset-2 hover:prose-a:text-flor-800 [&>h1:first-child]:hidden"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}
