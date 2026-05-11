'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { formatPrice } from '@/lib/format';
import { FreeShippingBar } from './free-shipping-bar';
import { CouponInput } from './coupon-input';
import { useAuth } from '@/lib/auth/auth-context';
import { useCart } from '@/contexts/cart-context';
import type { CartResponse } from '@flor/types';

interface Props {
  cart: CartResponse;
}

export function CartSummary({ cart }: Props) {
  const { user } = useAuth();
  const { applyCoupon, removeCoupon, couponValidation } = useCart();
  const router = useRouter();
  const [couponLoading, setCouponLoading] = useState(false);

  function handleCheckout() {
    if (user) {
      router.push('/checkout');
    } else {
      router.push('/login?redirect=/checkout');
    }
  }

  async function handleApplyCoupon(code: string) {
    setCouponLoading(true);
    try {
      const result = await applyCoupon(code);
      if (!result.success && result.error === 'LOGIN_REQUIRED') {
        toast.error('Faça login para usar cupons');
        router.push('/login?redirect=/carrinho');
      } else if (!result.success) {
        toast.error(result.error ?? 'Cupom inválido');
      }
    } finally {
      setCouponLoading(false);
    }
  }

  async function handleRemoveCoupon() {
    setCouponLoading(true);
    try {
      await removeCoupon();
    } finally {
      setCouponLoading(false);
    }
  }

  const discount = couponValidation?.valid ? couponValidation.discount : 0;
  const shippingIsFree =
    couponValidation?.valid && couponValidation.coupon?.type === 'FREE_SHIPPING';
  const estimatedTotal = cart.subtotal - discount;

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

        {discount > 0 && cart.couponCode && (
          <div className="flex justify-between text-green-700 font-medium">
            <span>Desconto ({cart.couponCode})</span>
            <span>−{formatPrice(discount)}</span>
          </div>
        )}

        {couponValidation?.valid &&
          couponValidation.appliedToItemsCount < couponValidation.totalItemsCount && (
            <p className="text-xs text-stone-500">
              Desconto aplicado em {couponValidation.appliedToItemsCount} de{' '}
              {couponValidation.totalItemsCount} itens
            </p>
          )}

        <div className="flex justify-between text-stone-500">
          <span>Frete</span>
          {shippingIsFree ? (
            <span className="text-green-600 font-medium">Grátis</span>
          ) : (
            <span className="text-stone-400">Calcular no checkout</span>
          )}
        </div>
      </div>

      <CouponInput
        appliedCode={cart.couponCode ?? null}
        validation={couponValidation}
        onApply={handleApplyCoupon}
        onRemove={handleRemoveCoupon}
        isLoading={couponLoading}
      />

      <div className="border-t border-stone-100 pt-4 flex justify-between font-semibold text-stone-800">
        <span>Total estimado</span>
        <span>{formatPrice(estimatedTotal)}</span>
      </div>

      <FreeShippingBar
        subtotal={cart.subtotal}
        threshold={cart.freeShippingThreshold}
        remaining={cart.freeShippingRemaining}
      />

      <button
        type="button"
        onClick={handleCheckout}
        className="w-full h-12 rounded-lg bg-stone-900 hover:bg-stone-800 active:bg-stone-950 text-white font-semibold text-sm tracking-wide transition-colors cursor-pointer shadow-sm hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
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
