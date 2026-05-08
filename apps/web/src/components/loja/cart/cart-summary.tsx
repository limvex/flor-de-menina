'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/format';
import { FreeShippingBar } from './free-shipping-bar';
import { useAuth } from '@/lib/auth/auth-context';
import type { CartResponse } from '@flor/types';

interface Props {
  cart: CartResponse;
}

export function CartSummary({ cart }: Props) {
  const { user } = useAuth();
  const router = useRouter();

  function handleCheckout() {
    if (user) {
      router.push('/checkout');
    } else {
      router.push('/entrar?redirect=/checkout');
    }
  }

  return (
    <div className="rounded-lg border border-stone-100 bg-white p-6 space-y-4 lg:sticky lg:top-24">
      <h2 className="font-serif text-xl text-stone-800">Resumo</h2>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-stone-600">
          <span>
            Subtotal ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'itens'})
          </span>
          <span>{formatPrice(cart.subtotal)}</span>
        </div>
        <div className="flex justify-between text-stone-500">
          <span>Frete</span>
          <span className="text-stone-400">Calcular no checkout</span>
        </div>
        {/* TODO: task-#20 — cupom */}
      </div>

      <div className="border-t border-stone-100 pt-4 flex justify-between font-semibold text-stone-800">
        <span>Total estimado</span>
        <span>{formatPrice(cart.subtotal)}</span>
      </div>

      <FreeShippingBar
        subtotal={cart.subtotal}
        threshold={cart.freeShippingThreshold}
        remaining={cart.freeShippingRemaining}
      />

      <button
        onClick={handleCheckout}
        className="w-full h-12 rounded bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm tracking-wide transition-colors"
      >
        Finalizar compra
      </button>

      <Link
        href="/produtos"
        className="block text-center text-xs text-stone-500 hover:text-flor-700 transition-colors"
      >
        ← Continuar comprando
      </Link>
    </div>
  );
}
