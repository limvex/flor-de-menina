'use client';

import { cn } from '@/lib/utils';

export type CheckoutPaymentMethod = 'PIX' | 'CREDIT_CARD';

interface Props {
  value: CheckoutPaymentMethod;
  onChange: (m: CheckoutPaymentMethod) => void;
}

export function PaymentMethodSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(['PIX', 'CREDIT_CARD'] as CheckoutPaymentMethod[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={cn(
            'rounded-lg border p-4 text-center transition-colors',
            value === m
              ? 'border-flor-800 bg-flor-50'
              : 'border-flor-200 bg-white hover:border-flor-400',
          )}
          aria-pressed={value === m}
        >
          <p className="text-sm font-medium text-flor-800">
            {m === 'PIX' ? 'PIX' : 'Cartão de crédito'}
          </p>
          <p className="text-xs text-flor-500">
            {m === 'PIX' ? 'Aprovação após confirmação' : 'Token seguro (Mercado Pago)'}
          </p>
        </button>
      ))}
    </div>
  );
}
