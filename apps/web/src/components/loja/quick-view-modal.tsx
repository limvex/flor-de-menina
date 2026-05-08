'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/format';
import type { PublicProduct } from '@/lib/api/products-public';

interface QuickViewModalProps {
  product: PublicProduct | null;
  onClose: () => void;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  if (!product) return null;

  return (
    <Dialog open={!!product} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="relative aspect-[3/4] bg-stone-100">
            {product.primaryImage ? (
              <Image src={product.primaryImage} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-stone-400">
                Sem imagem
              </div>
            )}
          </div>
          <div className="p-6 flex flex-col">
            <DialogTitle className="font-serif text-xl text-stone-900 leading-snug">
              {product.name}
            </DialogTitle>
            <p className="text-xs text-stone-500 uppercase tracking-wide mt-1">
              {product.category.name}
            </p>
            <div className="mt-3 flex items-center gap-3">
              {product.compareAtPrice != null && product.compareAtPrice > product.basePrice && (
                <span className="text-sm text-stone-400 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
              <span className="text-xl font-medium text-stone-900">
                {formatPrice(product.basePrice)}
              </span>
            </div>

            {product.availableColors.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-stone-500 uppercase tracking-wide mb-2">
                  Cores disponíveis
                </p>
                <div className="flex gap-2">
                  {product.availableColors.map((color, i) => (
                    <span
                      key={i}
                      className="h-6 w-6 rounded-full border border-stone-200"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            )}

            {product.isOutOfStock && (
              <p className="mt-4 text-sm text-stone-500">Este produto está esgotado no momento.</p>
            )}

            <div className="mt-auto pt-6 space-y-3">
              {/* TODO(task-#14): integrar adicionar ao carrinho */}
              <button
                type="button"
                disabled={product.isOutOfStock}
                className="w-full bg-stone-900 text-white py-3 text-sm font-medium uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-stone-700 transition-colors"
              >
                {product.isOutOfStock ? 'Esgotado' : 'Adicionar ao carrinho'}
              </button>
              <Link
                href={`/produto/${product.slug}`}
                onClick={onClose}
                className="block w-full text-center py-3 text-sm text-stone-700 border border-stone-200 hover:border-stone-900 transition-colors"
              >
                Ver detalhes completos →
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
