'use client';

import { ShoppingBag } from 'lucide-react';

interface CartBadgeProps {
  count?: number;
  onClick?: () => void;
  isTransparent?: boolean;
}

export function CartBadge({ count = 0, onClick, isTransparent = false }: CartBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={`relative cursor-pointer p-2 transition-colors ${
        isTransparent ? 'text-white hover:text-white/70' : 'text-flor-500 hover:text-flor-700'
      }`}
      aria-label={`Sacola de compras (${count} ${count === 1 ? 'item' : 'itens'})`}
    >
      <ShoppingBag className="h-5 w-5" />
      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-flor-600 text-[10px] font-sans font-medium text-white leading-none">
        {count > 99 ? '99+' : count}
      </span>
    </button>
  );
}
