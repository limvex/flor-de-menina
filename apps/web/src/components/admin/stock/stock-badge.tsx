import { LOW_STOCK_THRESHOLD } from '@flor/types';
import { cn } from '@/lib/utils';

interface StockBadgeProps {
  stock: number;
  className?: string;
}

export function StockBadge({ stock, className }: StockBadgeProps) {
  if (stock <= 0) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700',
          className,
        )}
      >
        Esgotado
      </span>
    );
  }
  if (stock < LOW_STOCK_THRESHOLD) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700',
          className,
        )}
      >
        Estoque baixo: {stock}
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700',
        className,
      )}
    >
      Em estoque: {stock}
    </span>
  );
}
