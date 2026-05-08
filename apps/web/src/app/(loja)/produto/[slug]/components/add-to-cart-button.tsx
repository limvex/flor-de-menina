'use client';

import { ShoppingBag } from 'lucide-react';

interface Props {
  variantId: string | null;
  isOutOfStock: boolean;
  onAddToCart: () => void;
}

export function AddToCartButton({ variantId, isOutOfStock, onAddToCart }: Props) {
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
      onClick={onAddToCart}
      className="w-full h-14 text-base font-semibold rounded bg-stone-900 hover:bg-stone-800 text-white uppercase tracking-wide flex items-center justify-center gap-2 transition-colors"
    >
      <ShoppingBag className="h-5 w-5" />
      Adicionar ao carrinho
    </button>
  );
}
