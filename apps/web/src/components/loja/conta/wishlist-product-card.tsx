'use client';

import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import type { WishlistItem } from '@flor/types';

interface Props {
  item: WishlistItem;
  onRemove: (productId: string) => void;
  removing?: boolean;
}

export function WishlistProductCard({ item, onRemove, removing }: Props) {
  const { product } = item;
  const isOutOfStock = product.totalStock === 0;

  return (
    <article
      className={`relative group transition-opacity ${removing ? 'opacity-40 pointer-events-none' : ''}`}
    >
      <button
        type="button"
        onClick={() => onRemove(item.productId)}
        aria-label={`Remover ${product.name} dos favoritos`}
        className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
      >
        <X className="h-3.5 w-3.5 text-stone-600" />
      </button>

      <Link href={`/produto/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
          {product.primaryImage ? (
            <Image
              src={product.primaryImage}
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
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="text-sm font-medium text-stone-500">Esgotado</span>
            </div>
          )}
        </div>
        <div className="mt-3 space-y-1 px-1">
          <p className="text-xs text-stone-500 uppercase tracking-wide">{product.category.name}</p>
          <h3 className="font-serif text-sm text-stone-900 leading-snug line-clamp-2">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            {product.compareAtPrice != null && product.compareAtPrice > product.basePrice && (
              <span className="text-xs text-stone-400 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
            <span
              className={`text-sm font-medium ${isOutOfStock ? 'text-stone-400' : 'text-stone-900'}`}
            >
              {formatPrice(product.basePrice)}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
