'use client';

import { useState } from 'react';
import { Loader2, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/format';
import { useCart } from '@/contexts/cart-context';
import type { LocalCartItemSnapshot } from '@/lib/cart-storage';

interface Props {
  price: number;
  variantId: string | null;
  isOutOfStock: boolean;
  snapshot?: LocalCartItemSnapshot;
}

export function StickyMobileCta({ price, variantId, isOutOfStock, snapshot }: Props) {
  const { addItem } = useCart();
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!variantId) return;
    setLoading(true);
    try {
      await addItem(variantId, 1, snapshot);
    } catch {
      toast.error('Ops! Esse item não está mais disponível');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white p-3 md:hidden shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-xs text-stone-400">Total</p>
          <p className="text-lg font-semibold text-stone-900">{formatPrice(price)}</p>
        </div>
        <button
          onClick={handleAdd}
          disabled={!variantId || isOutOfStock || loading}
          className="h-12 flex-1 rounded bg-stone-900 hover:bg-stone-800 text-white font-semibold flex items-center justify-center gap-2 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ShoppingBag className="h-4 w-4" />
          )}
          {isOutOfStock ? 'Esgotado' : !variantId ? 'Selecione' : loading ? '' : 'Comprar'}
        </button>
      </div>
    </div>
  );
}
