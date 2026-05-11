'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { formatPrice } from '@/lib/format';
import type { CartResponse } from '@flor/types';

interface InsufficientItem {
  productName: string;
  variantLabel: string;
  requested: number;
  available: number;
}

interface Props {
  cart: CartResponse | null;
  shippingCost: number;
  discount?: number;
  paymentLabel: string;
  giftWrap: boolean;
  onGiftWrapChange: (value: boolean) => void;
  stockErrors?: InsufficientItem[];
}

/** Resumo da compra — layout mobile-first inspirado em e-commerces tipo Mirak. */
export function CheckoutPurchaseSummary({
  cart,
  shippingCost,
  discount = 0,
  paymentLabel,
  giftWrap,
  onGiftWrapChange,
  stockErrors = [],
}: Props) {
  const [showProducts, setShowProducts] = useState(false);

  const subtotal = cart?.subtotal ?? 0;
  const total = subtotal + shippingCost - discount;
  const count = cart?.itemCount ?? 0;
  const countLabel = String(count).padStart(2, '0');

  return (
    <section
      className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm md:p-5"
      aria-labelledby="checkout-resumo-heading"
    >
      <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#5c4033]/10 text-[#5c4033]">
          <ShoppingCart className="h-4 w-4" aria-hidden />
        </span>
        <h3
          id="checkout-resumo-heading"
          className="text-sm font-semibold uppercase tracking-wide text-stone-800"
        >
          Resumo da compra
        </h3>
      </div>

      <dl className="mt-4 space-y-2.5 text-sm text-stone-700">
        <div className="flex justify-between gap-3">
          <dt>Subtotal</dt>
          <dd className="font-medium text-stone-900">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Frete</dt>
          <dd className="font-medium text-stone-900">{formatPrice(shippingCost)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Desconto</dt>
          <dd className="font-medium text-stone-900">
            {discount > 0 ? `− ${formatPrice(discount)}` : formatPrice(0)}
          </dd>
        </div>
        <div className="flex justify-between gap-3 border-t border-stone-100 pt-2.5">
          <dt>Forma de pagamento</dt>
          <dd className="font-medium capitalize text-stone-900">{paymentLabel}</dd>
        </div>
        <div className="flex justify-between gap-3 pt-1 text-base font-semibold text-stone-900">
          <dt>Total</dt>
          <dd>{formatPrice(total)}</dd>
        </div>
      </dl>

      <div className="mt-5 space-y-2">
        <p className="text-sm text-stone-600">
          Itens no carrinho: <span className="font-semibold text-stone-900">{countLabel}</span>
        </p>
        <button
          type="button"
          onClick={() => setShowProducts((v) => !v)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-stone-900 bg-white py-2.5 text-sm font-medium text-stone-900 transition hover:bg-stone-50 active:bg-stone-100"
          aria-expanded={showProducts}
        >
          {showProducts ? (
            <>
              Ocultar produtos
              <ChevronUp className="h-4 w-4" aria-hidden />
            </>
          ) : (
            <>
              Visualizar produtos
              <ChevronDown className="h-4 w-4" aria-hidden />
            </>
          )}
        </button>
      </div>

      {showProducts && (
        <ul className="mt-4 space-y-4 border-t border-stone-100 pt-4">
          {cart?.items.map((item) => {
            const hasStockError = stockErrors.some(
              (e) => e.productName === item.product.name && e.variantLabel === item.variant.label,
            );
            const lineTotal = item.variant.price * item.quantity;
            const compare = item.variant.compareAtPrice;
            const showStrike = compare != null && compare > item.variant.price;

            return (
              <li
                key={item.id}
                className={`flex gap-3 ${hasStockError ? 'rounded-lg border border-red-200 bg-red-50 p-2' : ''}`}
              >
                <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-md bg-stone-100">
                  {item.product.image ? (
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-stone-900">
                    {item.product.name}
                  </p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    {item.variant.label} · Qtd: {item.quantity}{' '}
                    {item.quantity === 1 ? 'unidade' : 'unidades'}
                  </p>
                  {hasStockError && (
                    <p role="alert" className="mt-1 text-xs text-red-600">
                      Apenas{' '}
                      {stockErrors.find((e) => e.productName === item.product.name)?.available}{' '}
                      disponível(is)
                    </p>
                  )}
                  <div className="mt-2 flex items-baseline gap-2">
                    {showStrike ? (
                      <span className="text-sm text-stone-400 line-through">
                        {formatPrice((compare ?? 0) * item.quantity)}
                      </span>
                    ) : null}
                    <span className="text-sm font-semibold text-stone-900">
                      {formatPrice(lineTotal)}
                    </span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
        <Label htmlFor="gift-wrap" className="text-sm font-normal text-stone-700 cursor-pointer">
          Deseja embrulhar para presente
        </Label>
        <Switch id="gift-wrap" checked={giftWrap} onCheckedChange={onGiftWrapChange} />
      </div>
    </section>
  );
}
