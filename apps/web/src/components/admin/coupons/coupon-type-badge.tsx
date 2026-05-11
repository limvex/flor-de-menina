import type { CouponType } from '@flor/types';

interface Props {
  type: CouponType;
  value?: number;
}

export function CouponTypeBadge({ type, value }: Props) {
  if (type === 'PERCENTAGE') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
        {value}% off
      </span>
    );
  }
  if (type === 'FIXED_AMOUNT') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">
        R$ off
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
      Frete grátis
    </span>
  );
}
