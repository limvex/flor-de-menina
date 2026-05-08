'use client';

import { useState } from 'react';
import { Breadcrumbs } from '@/components/loja/breadcrumbs';
import { ProductGallery } from './components/product-gallery';
import { VariantSelector } from './components/variant-selector';
import { PriceDisplay } from './components/price-display';
import { AddToCartButton } from './components/add-to-cart-button';
import { AddToWishlistButton } from './components/add-to-wishlist-button';
import { ShareButton } from './components/share-button';
import { ShippingCalculator } from './components/shipping-calculator';
import { MeasureTableModal } from './components/measure-table-modal';
import { ProductTabs } from './components/product-tabs';
import { RelatedProducts } from './components/related-products';
import { ReviewsSection } from './components/reviews-section';
import { StockIndicator } from './components/stock-indicator';
import { StickyMobileCta } from './components/sticky-mobile-cta';
import type { ProductDetail, ProductVariant } from '@/lib/api/product-detail';
import type { LocalCartItemSnapshot } from '@/lib/cart-storage';

interface Props {
  product: ProductDetail;
  isAuthenticated: boolean;
}

export function PdpClient({ product, isAuthenticated }: Props) {
  const firstAvailable = product.variants?.find((v: ProductVariant) => v.stock > 0) ?? null;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    firstAvailable?.id ?? null,
  );
  const [measureTableOpen, setMeasureTableOpen] = useState(false);

  const selectedVariant =
    product.variants?.find((v: ProductVariant) => v.id === selectedVariantId) ?? null;
  const currentPrice = selectedVariant?.price ?? product.basePrice ?? 0;
  const stockOfSelected = selectedVariant?.stock ?? 0;

  const cartSnapshot: LocalCartItemSnapshot | undefined = selectedVariantId
    ? {
        productName: product.name,
        productSlug: product.slug,
        productImage: product.images?.[0]?.cardUrl ?? product.images?.[0]?.url ?? '',
        variantPrice: currentPrice,
        variantSize: selectedVariant?.size ?? null,
        variantColor: selectedVariant?.color ?? null,
        variantStock: stockOfSelected,
      }
    : undefined;

  const breadcrumbItems = [
    { label: 'Produtos', href: '/produtos' },
    ...(product.category
      ? [{ label: product.category.name, href: `/categoria/${product.category.slug}` }]
      : []),
    { label: product.name },
  ];

  return (
    <div className="container mx-auto px-4 py-6 pb-32 md:pb-12 max-w-7xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
        {/* Coluna galeria */}
        <ProductGallery images={product.images ?? []} productName={product.name} />

        {/* Coluna info */}
        <div className="space-y-6">
          <div>
            {product.category && (
              <p className="text-xs uppercase tracking-wider text-stone-400">
                {product.category.name}
              </p>
            )}
            <h1 className="mt-1 font-serif text-3xl text-stone-900 leading-tight">
              {product.name}
            </h1>
            {product.shortDescription && (
              <p className="mt-2 text-stone-500">{product.shortDescription}</p>
            )}
          </div>

          <PriceDisplay basePrice={currentPrice} compareAtPrice={product.compareAtPrice} />

          {product.variants?.length > 0 && (
            <VariantSelector
              variants={product.variants}
              selectedVariantId={selectedVariantId}
              onSelect={setSelectedVariantId}
              onOpenMeasureTable={() => setMeasureTableOpen(true)}
              hasMeasureTable={!!product.category?.sizeChart}
            />
          )}

          <StockIndicator stock={stockOfSelected} isOutOfStock={product.isOutOfStock ?? false} />

          <ShippingCalculator />

          <div className="space-y-3">
            <AddToCartButton
              variantId={selectedVariantId}
              isOutOfStock={product.isOutOfStock ?? false}
              snapshot={cartSnapshot}
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <AddToWishlistButton
                  productId={product.id}
                  variantId={selectedVariantId}
                  isAuthenticated={isAuthenticated}
                />
              </div>
              <ShareButton productName={product.name} />
            </div>
          </div>

          <p className="text-xs text-stone-400">
            ✓ Trocas e devoluções em até 7 dias após o recebimento
          </p>
        </div>
      </div>

      <ProductTabs
        description={product.description ?? ''}
        weight={product.weight}
        width={product.width}
        height={product.height}
        length={product.length}
      />

      <RelatedProducts products={product.relatedProducts ?? []} />

      <ReviewsSection productId={product.id} />

      {product.category && (
        <MeasureTableModal
          open={measureTableOpen}
          onOpenChange={setMeasureTableOpen}
          measureTable={product.category.sizeChart}
          categoryName={product.category.name}
        />
      )}

      <StickyMobileCta
        price={currentPrice}
        variantId={selectedVariantId}
        isOutOfStock={product.isOutOfStock ?? false}
        snapshot={cartSnapshot}
      />
    </div>
  );
}
