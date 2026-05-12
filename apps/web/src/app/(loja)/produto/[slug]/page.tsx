import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/api/product-detail';
import { requireCustomer } from '@/lib/auth/require-customer';
import { PdpClient } from './pdp-client';

function plainTextFromHtml(html: string | null | undefined, maxLen: number): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const product = await getProductBySlug(slug);
    const image = product.images?.[0]?.url;

    return {
      title: product.seoTitle?.trim() || product.name,
      description:
        product.seoDescription?.trim() ??
        product.shortDescription ??
        plainTextFromHtml(product.description, 160),
      openGraph: {
        title: product.name,
        description: product.shortDescription ?? plainTextFromHtml(product.description, 200),
        type: 'website',
        images: image ? [{ url: image, width: 1200, height: 1600, alt: product.name }] : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: product.name,
        description: product.shortDescription ?? plainTextFromHtml(product.description, 200),
        images: image ? [image] : [],
      },
      alternates: { canonical: `/produto/${slug}` },
    };
  } catch {
    return { title: { absolute: 'Produto não encontrado | Flor de Menina' } };
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

  const offerPrices = product.variants.filter((v) => v.isActive && v.price > 0).map((v) => v.price);
  const offerPrice =
    offerPrices.length > 0 ? Math.min(...offerPrices) : Number(product.basePrice ?? 0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: plainTextFromHtml(product.shortDescription ?? product.description, 8000),
    image: (product.images?.map((img) => img.url) ?? []).filter(Boolean),
    sku: product.variants?.[0]?.sku,
    brand: { '@type': 'Brand', name: 'Flor de Menina' },
    offers: {
      '@type': 'Offer',
      url: `https://flordemenina.store/produto/${product.slug}`,
      priceCurrency: 'BRL',
      price: Number(offerPrice.toFixed(2)),
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
