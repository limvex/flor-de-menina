'use client';

import { AlertTriangle, Check, Truck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { quoteShipping } from '@/lib/api/orders';
import { useCart } from '@/contexts/cart-context';
import { useCheckout } from '@/contexts/checkout-context';
import { formatPrice } from '@/lib/format';
import type { ShippingOption } from '@flor/types';

export function StepShipping() {
  const { cart } = useCart();
  const { state, setShipping, goToStep } = useCheckout();
  const subtotal = cart?.subtotal ?? 0;
  const [selected, setSelected] = useState<string | null>(state.shipping?.id ?? null);

  const destinationZipCode = state.address?.snapshot.zipCode ?? '';
  const items = (cart?.items ?? []).map((i) => ({
    variantId: i.variantId,
    quantity: i.quantity,
  }));

  const {
    data: quoteResult,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      'shipping-quote',
      destinationZipCode,
      subtotal,
      items.map((i) => i.variantId).join(','),
    ],
    queryFn: () =>
      quoteShipping({
        destinationZipCode,
        subtotal,
        items,
      }),
    enabled: !!destinationZipCode && items.length > 0,
    staleTime: 60_000,
  });

  const options = quoteResult?.options ?? [];
  const usedFallback = quoteResult?.usedFallback ?? false;

  const handleContinue = () => {
    if (!selected) return;
    goToStep(4);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4">
        <h2 className="font-serif text-xl font-normal text-flor-800">Opções de entrega</h2>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Não foi possível calcular o frete. Verifique o CEP e tente novamente.
        </div>
        <Button type="button" variant="outline" className="w-full" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="font-serif text-xl font-normal text-flor-800">Opções de entrega</h2>

      {usedFallback && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800"
          aria-label="Atenção: cotação aproximada"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Cotação aproximada — confirme o valor com o vendedor antes de finalizar.</span>
        </div>
      )}

      <ul className="space-y-3" role="radiogroup" aria-label="Opções de frete">
        {options.map((opt: ShippingOption) => (
          <li key={opt.id}>
            <button
              type="button"
              role="radio"
              aria-checked={selected === opt.id}
              onClick={() => {
                setSelected(opt.id);
                setShipping(opt);
              }}
              className={cn(
                'w-full rounded-lg border p-4 text-left transition-colors',
                selected === opt.id
                  ? 'border-flor-800 bg-flor-50'
                  : 'border-flor-200 bg-white hover:border-flor-400',
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-flor-500" aria-hidden="true" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-flor-800">{opt.label}</p>
                      {opt.cost === 0 && (
                        <span
                          className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700"
                          aria-label="Frete grátis"
                        >
                          GRÁTIS
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-flor-500">
                      {opt.carrier} · {opt.estimatedDays} dias úteis
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-flor-800">
                    {opt.cost === 0 ? 'Grátis' : formatPrice(opt.cost)}
                  </span>
                  {selected === opt.id && (
                    <Check className="h-5 w-5 text-flor-800" aria-hidden="true" />
                  )}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        className="w-full bg-flor-800 hover:bg-flor-700 text-white"
        disabled={!selected}
        onClick={handleContinue}
      >
        Continuar
      </Button>
    </div>
  );
}
