import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

interface CartBadgeProps {
  count?: number;
}

export function CartBadge({ count = 0 }: CartBadgeProps) {
  return (
    <Link
      href="/carrinho"
      className="relative p-2 text-flor-500 hover:text-flor-700 transition-colors"
      aria-label={`Sacola de compras (${count} ${count === 1 ? 'item' : 'itens'})`}
    >
      <ShoppingBag className="h-5 w-5" />
      <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-flor-600 text-[10px] font-sans font-medium text-white leading-none">
        {count > 99 ? '99+' : count}
      </span>
    </Link>
  );
}
