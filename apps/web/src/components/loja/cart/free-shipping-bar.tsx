'use client';

import { CheckCircle } from 'lucide-react';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Props {
  subtotal: number;
  threshold: number;
  remaining: number;
  className?: string;
}

export function FreeShippingBar({ subtotal, threshold, remaining, className }: Props) {
  const progress = Math.min(100, Math.round((subtotal / threshold) * 100));
  const unlocked = remaining === 0;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between text-xs">
        {unlocked ? (
          <span className="flex items-center gap-1 font-medium text-emerald-600">
            <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Frete grátis desbloqueado!
          </span>
        ) : (
          <span className="text-stone-500">
            Falta <span className="font-medium text-stone-700">{formatPrice(remaining)}</span> para
            frete grátis
          </span>
        )}
        <span className="text-stone-400">{formatPrice(threshold)}</span>
      </div>
      <div
        className="h-1.5 w-full rounded-full bg-stone-100 overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label="Progresso para frete grátis"
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            unlocked ? 'bg-emerald-500' : 'bg-flor-500',
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
