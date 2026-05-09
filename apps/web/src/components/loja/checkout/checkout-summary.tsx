'use client';

import Image from 'next/image';
import { Shield } from 'lucide-react';
import { useCart } from '@/contexts/cart-context';
import { useCheckout } from '@/contexts/checkout-context';
import { ReservationTimer } from '@/components/loja/cart/reservation-timer';
import { formatPrice } from '@/lib/format';
import { Separator } from '@/components/ui/separator';

export function CheckoutSummary() {
  const { cart } = useCart();
  const { state } = useCheckout();

  if (!cart || cart.items.length === 0) return null;

  const earliestExpiry = cart.items
    .map((i) => i.reservedUntil)
    .filter((r): r is string => r !== null)
    .sort()[0];

  const shippingCost = state.shipping?.cost ?? null;
  const total = shippingCost !== null ? cart.subtotal + shippingCost : cart.subtotal;

  return (
    <aside className="rounded-xl border border-flor-100 bg-flor-50 p-5 space-y-4 sticky top-6">
      <h2 className="font-serif text-lg font-normal text-flor-800">Resumo do pedido</h2>

      <ul className="space-y-3">
        {cart.items.map((item) => (
          <li key={item.id} className="flex gap-3">
            <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-md bg-flor-100">
              {item.product.image ? (
                <Image
                  src={item.product.image}
                  alt={item.product.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              ) : (
                <div className="h-full w-full bg-flor-200" />
              )}
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-flor-800 text-[10px] text-white">
                {item.quantity}
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-center">
              <p className="text-xs font-medium text-flor-800 line-clamp-2">{item.product.name}</p>
              <p className="text-xs text-flor-500">{item.variant.label}</p>
              <p className="text-xs font-medium text-flor-700">
                {formatPrice(item.variant.price * item.quantity)}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <Separator />

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-flor-500">Subtotal</span>
          <span className="text-flor-800">{formatPrice(cart.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-flor-500">Frete</span>
          <span className="text-flor-800">
            {shippingCost === null
              ? '—'
              : shippingCost === 0
                ? 'Grátis'
                : formatPrice(shippingCost)}
          </span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold">
          <span className="text-flor-800">Total</span>
          <span className="text-flor-800">{formatPrice(total)}</span>
        </div>
      </div>

      {earliestExpiry && (
        <ReservationTimer reservedUntil={earliestExpiry} className="justify-center" />
      )}

      <div className="flex items-center justify-center gap-1.5 text-xs text-flor-400">
        <Shield className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Compra 100% segura</span>
      </div>
    </aside>
  );
}
