'use client';

import { useState } from 'react';
import Image from 'next/image';
import { toast } from 'sonner';
import { useCart } from '@/contexts/cart-context';
import { useCheckout } from '@/contexts/checkout-context';
import { formatPrice } from '@/lib/format';
import { Separator } from '@/components/ui/separator';
import { CouponInput } from '@/components/loja/cart/coupon-input';

export function CheckoutSummary() {
  const { cart, couponValidation, applyCoupon, removeCoupon } = useCart();
  const { state } = useCheckout();
  const [couponLoading, setCouponLoading] = useState(false);

  async function handleApplyCoupon(code: string) {
    setCouponLoading(true);
    try {
      const result = await applyCoupon(code);
      if (!result.success) {
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

  if (!cart || cart.items.length === 0) return null;

  const shippingCost = state.shipping?.cost ?? null;
  const discount = couponValidation?.valid ? couponValidation.discount : 0;
  const isFreeShipping =
    couponValidation?.valid && couponValidation.coupon?.type === 'FREE_SHIPPING';
  const effectiveShipping = isFreeShipping ? 0 : (shippingCost ?? null);
  const total =
    effectiveShipping !== null
      ? cart.subtotal - discount + effectiveShipping
      : cart.subtotal - discount;

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

      <CouponInput
        appliedCode={cart.couponCode ?? null}
        validation={couponValidation}
        onApply={handleApplyCoupon}
        onRemove={handleRemoveCoupon}
        isLoading={couponLoading}
      />

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-flor-500">Subtotal</span>
          <span className="text-flor-800">{formatPrice(cart.subtotal)}</span>
        </div>
        {discount > 0 && cart.couponCode && (
          <div className="flex justify-between text-green-700 font-medium">
            <span>Desconto ({cart.couponCode})</span>
            <span>−{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-flor-500">Frete</span>
          <span className="text-flor-800">
            {isFreeShipping ? (
              <span className="text-green-600 font-medium">Grátis</span>
            ) : effectiveShipping === null ? (
              '—'
            ) : (
              formatPrice(effectiveShipping)
            )}
          </span>
        </div>
        <Separator />
        <div className="flex justify-between font-semibold">
          <span className="text-flor-800">Total</span>
          <span className="text-flor-800">{formatPrice(total)}</span>
        </div>
      </div>
    </aside>
  );
}
