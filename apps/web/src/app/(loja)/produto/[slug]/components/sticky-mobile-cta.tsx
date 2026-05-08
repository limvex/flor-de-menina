'use client';

import { ShoppingBag } from 'lucide-react';
import { formatPrice } from '@/lib/format';

interface Props {
  price: number;
  variantId: string | null;
  isOutOfStock: boolean;
  onAddToCart: () => void;
}

export function StickyMobileCta({ price, variantId, isOutOfStock, onAddToCart }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white p-3 md:hidden shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-stone-400">Total</p>
          <p className="text-lg font-semibold text-stone-900">{formatPrice(price)}</p>
        </div>
        <button
          onClick={onAddToCart}
          disabled={!variantId || isOutOfStock}
          className="h-12 flex-1 rounded bg-stone-900 hover:bg-stone-800 text-white font-semibold flex items-center justify-center gap-2 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
        >
          <ShoppingBag className="h-4 w-4" />
          {isOutOfStock ? 'Esgotado' : !variantId ? 'Selecione' : 'Comprar'}
        </button>
      </div>
    </div>
  );
}
