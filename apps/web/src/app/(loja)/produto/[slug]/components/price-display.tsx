import { formatPrice } from '@/lib/format';

interface Props {
  basePrice: number;
  compareAtPrice?: number | null;
}

export function PriceDisplay({ basePrice, compareAtPrice }: Props) {
  const hasDiscount = compareAtPrice != null && compareAtPrice > basePrice;
  const discountPct = hasDiscount ? Math.round((1 - basePrice / compareAtPrice) * 100) : null;

  return (
    <div className="space-y-1">
      {hasDiscount && (
        <p className="text-sm text-stone-400 line-through">{formatPrice(compareAtPrice)}</p>
      )}
      <div className="flex items-center gap-3">
        <p className="font-serif text-3xl font-medium text-stone-900">{formatPrice(basePrice)}</p>
        {discountPct && (
          <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            -{discountPct}%
          </span>
        )}
      </div>
      <p className="text-xs text-stone-500">Em até 3x de {formatPrice(basePrice / 3)} sem juros</p>
    </div>
  );
}
