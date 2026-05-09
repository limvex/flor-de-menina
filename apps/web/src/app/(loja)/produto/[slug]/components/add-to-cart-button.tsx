'use client';

import { useState } from 'react';
import { Loader2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import type { LocalCartItemSnapshot } from '@/lib/cart-storage';

interface Props {
  variantId: string | null;
  isOutOfStock: boolean;
  snapshot?: LocalCartItemSnapshot;
}

export function AddToCartButton({ variantId, isOutOfStock, snapshot }: Props) {
  const { addItem } = useCart();
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!variantId) return;
    setLoading(true);
    try {
      await addItem(variantId, 1, snapshot);
    } catch {
      // erro já tratado pelo CartProvider (toast + rollback)
    } finally {
      setLoading(false);
    }
  }

  if (isOutOfStock) {
    return (
      <button
        disabled
        className="w-full h-14 text-base rounded bg-stone-200 text-stone-500 cursor-not-allowed font-medium"
      >
        Esgotado
      </button>
    );
  }

  if (!variantId) {
    return (
      <button
        disabled
        className="w-full h-14 text-base rounded bg-stone-300 text-stone-600 cursor-not-allowed font-medium"
      >
        Selecione tamanho e cor
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      disabled={loading}
      className="w-full h-14 text-base font-semibold rounded bg-stone-900 hover:bg-stone-800 text-white uppercase tracking-wide flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
    >
      {loading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin" />
          Adicionando...
        </>
      ) : (
        <>
          <ShoppingBag className="h-5 w-5" />
          Adicionar à sacola
        </>
      )}
    </button>
  );
}
