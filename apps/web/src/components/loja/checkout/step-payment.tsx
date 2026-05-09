'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCart } from '@/contexts/cart-context';
import { useCheckout } from '@/contexts/checkout-context';
import { PixInstructions } from './pix-instructions';
import { CardForm } from './card-form';
import type { CardData } from './card-form';

type Method = 'PIX' | 'CREDIT_CARD';

export function StepPayment() {
  const { cart } = useCart();
  const { state, setPayment } = useCheckout();
  const shippingCost = state.shipping?.cost ?? 0;
  const total = (cart?.subtotal ?? 0) + shippingCost;

  const [method, setMethod] = useState<Method>(state.payment?.method ?? 'PIX');
  // Card data lives ONLY in local state — never persisted to sessionStorage
  const [cardData, setCardData] = useState<CardData | null>(null);

  const canContinue = method === 'PIX' || (method === 'CREDIT_CARD' && cardData !== null);

  const handleContinue = () => {
    if (!canContinue) return;
    setPayment({ method });
  };

  return (
    <div className="space-y-5">
      <h2 className="font-serif text-xl font-normal text-flor-800">Forma de pagamento</h2>

      <div className="grid grid-cols-2 gap-3">
        {(['PIX', 'CREDIT_CARD'] as Method[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={cn(
              'rounded-lg border p-4 text-center transition-colors',
              method === m
                ? 'border-flor-800 bg-flor-50'
                : 'border-flor-200 bg-white hover:border-flor-400',
            )}
            aria-pressed={method === m}
          >
            <p className="text-sm font-medium text-flor-800">
              {m === 'PIX' ? 'PIX' : 'Cartão de crédito'}
            </p>
            <p className="text-xs text-flor-500">
              {m === 'PIX' ? 'Aprovação imediata' : 'Até 12x sem juros'}
            </p>
          </button>
        ))}
      </div>

      {method === 'PIX' && <PixInstructions />}

      {method === 'CREDIT_CARD' && <CardForm total={total} onChange={setCardData} />}

      <Button
        type="button"
        className="w-full bg-flor-800 hover:bg-flor-700 text-white"
        disabled={!canContinue}
        onClick={handleContinue}
      >
        Continuar
      </Button>
    </div>
  );
}
