'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/format';
import type { PublicProduct } from '@/lib/api/products-public';

interface ProductCardProps {
  product: PublicProduct;
  onQuickView?: (productId: string) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const displayImage =
    hovered && product.secondaryImage ? product.secondaryImage : product.primaryImage;

  const hasDiscount = product.compareAtPrice != null && product.compareAtPrice > product.basePrice;
  const discountPct = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.basePrice) / product.compareAtPrice!) * 100)
    : 0;

  return (
    <article
      className="group relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/produto/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400 text-sm">
              Sem imagem
            </div>
          )}

          {/* Badges */}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.isNew && !product.isOutOfStock && (
              <Badge className="bg-amber-900 text-white text-xs">Novidade</Badge>
            )}
            {hasDiscount && !product.isOutOfStock && (
              <Badge className="bg-red-600 text-white text-xs">-{discountPct}%</Badge>
            )}
            {product.isLastPiece && !product.isOutOfStock && (
              <Badge
                variant="outline"
                className="border-amber-900 text-amber-900 text-xs bg-white/90"
              >
                Última peça
              </Badge>
            )}
            {product.isOutOfStock && (
              <Badge
                variant="outline"
                className="border-stone-400 text-stone-500 text-xs bg-white/90"
              >
                Esgotado
              </Badge>
            )}
          </div>

          {/* Wishlist — TODO(task-#15): integrar módulo de wishlist */}
          <button
            type="button"
            aria-label="Adicionar à lista de desejos"
            onClick={(e) => {
              e.preventDefault();
            }}
            className="absolute right-2 top-2 rounded-full bg-white/90 p-2 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white"
          >
            <Heart className="h-4 w-4 text-stone-700" />
          </button>

          {/* Quick view — TODO(task-#14): integrar carrinho no modal */}
          {onQuickView && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onQuickView(product.id);
              }}
              className="absolute bottom-0 left-0 right-0 hidden bg-stone-900/85 py-3 text-center text-xs font-medium uppercase tracking-widest text-white opacity-0 transition-opacity group-hover:opacity-100 md:block"
            >
              Visualização rápida
            </button>
          )}
        </div>

        <div className="mt-3 space-y-1 px-1">
          <p className="text-xs text-stone-500 uppercase tracking-wide">{product.category.name}</p>
          <h3 className="font-serif text-sm text-stone-900 leading-snug line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            {hasDiscount && (
              <span className="text-xs text-stone-400 line-through">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
            <span
              className={`text-sm font-medium ${
                product.isOutOfStock ? 'text-stone-400' : 'text-stone-900'
              }`}
            >
              {formatPrice(product.basePrice)}
            </span>
          </div>
          {product.availableColors.length > 0 && (
            <div className="flex gap-1 pt-1">
              {product.availableColors.slice(0, 4).map((color, i) => (
                <span
                  key={i}
                  className="h-3 w-3 rounded-full border border-stone-200"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}
