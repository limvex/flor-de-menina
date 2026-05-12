import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/api/product-detail';
import { requireCustomer } from '@/lib/auth/require-customer';
import { PdpClient } from './pdp-client';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    const image = product.images?.[0]?.url;

    return {
      title: `${product.seoTitle ?? product.name} | Flor de Menina`,
      description:
        product.seoDescription ??
        product.shortDescription ??
        String(product.description ?? '').slice(0, 160),
      openGraph: {
        title: product.name,
        description: product.shortDescription ?? String(product.description ?? '').slice(0, 200),
        type: 'website',
        images: image ? [{ url: image, width: 1200, height: 1600, alt: product.name }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.shortDescription ?? String(product.description ?? '').slice(0, 200),
        images: image ? [image] : [],
      },
      alternates: { canonical: `/produto/${slug}` },
    };
  } catch {
    return { title: 'Produto não encontrado | Flor de Menina' };
  }
}

export default async function ProdutoPage({ params }: PageProps) {
  const { slug } = await params;

  let product: Awaited<ReturnType<typeof getProductBySlug>>;
  try {
    product = await getProductBySlug(slug);
  } catch {
    notFound();
  }

  const customer = await requireCustomer();
  const isAuthenticated = !!customer;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images?.map((img) => img.url) ?? [],
    sku: product.variants?.[0]?.sku,
    brand: { '@type': 'Brand', name: 'Flor de Menina' },
    offers: {
      '@type': 'Offer',
      url: `https://flordemenina.store/produto/${product.slug}`,
      priceCurrency: 'BRL',
      price: product.basePrice,
      availability: product.isOutOfStock
        ? 'https://schema.org/OutOfStock'
        : 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PdpClient product={product} isAuthenticated={isAuthenticated} />
    </>
  );
}
