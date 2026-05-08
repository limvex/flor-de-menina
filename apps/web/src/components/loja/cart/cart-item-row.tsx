'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';
import { ReservationTimer } from './reservation-timer';
import { useCart } from '@/contexts/cart-context';
import type { CartItemResponse } from '@flor/types';

interface Props {
  item: CartItemResponse;
}

export function CartItemRow({ item }: Props) {
  const { updateItem, removeItem } = useCart();
  const [qty, setQty] = useState(item.quantity);
  const [expired, setExpired] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mantém a quantidade sincronizada quando o carrinho atualiza externamente
  useEffect(() => {
    setQty(item.quantity);
  }, [item.quantity]);

  function handleQtyChange(next: number) {
    if (next < 1 || next > item.availableStock) return;
    setQty(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateItem(item.variantId, next).catch(() => setQty(item.quantity));
    }, 500);
  }

  const totalPrice = item.variant.price * qty;
  const isLastUnit = item.availableStock === 1;

  return (
    <div
      className={cn(
        'flex gap-4 rounded-lg border p-4 transition-colors',
        expired ? 'border-red-200 bg-red-50' : 'border-stone-100 bg-white',
      )}
    >
      {/* Imagem */}
      <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded">
        {item.product.image ? (
          <Image
            src={item.product.image}
            alt={item.product.name}
            fill
            className="object-cover"
            sizes="80px"
          />
        ) : (
          <div className="h-full w-full bg-stone-100" />
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/produto/${item.product.slug}`}
              className="line-clamp-2 font-medium text-stone-800 hover:text-flor-700 transition-colors text-sm leading-snug"
            >
              {item.product.name}
            </Link>
            <p className="text-xs text-stone-400 mt-0.5">{item.variant.label}</p>
          </div>
          <button
            onClick={() => removeItem(item.variantId)}
            aria-label="Remover item"
            className="flex-shrink-0 rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-red-500 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          {/* Controle de quantidade */}
          <div className="flex items-center rounded border border-stone-200">
            <button
              onClick={() => handleQtyChange(qty - 1)}
              disabled={qty <= 1}
              aria-label="Diminuir quantidade"
              className="flex h-8 w-8 items-center justify-center text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span
              aria-label={`Quantidade: ${qty}`}
              className="w-8 text-center text-sm font-medium text-stone-800"
            >
              {qty}
            </span>
            <button
              onClick={() => handleQtyChange(qty + 1)}
              disabled={qty >= item.availableStock}
              aria-label={
                qty >= item.availableStock
                  ? `Apenas ${item.availableStock} disponíveis`
                  : 'Aumentar quantidade'
              }
              title={
                qty >= item.availableStock ? `Apenas ${item.availableStock} disponíveis` : undefined
              }
              className="flex h-8 w-8 items-center justify-center text-stone-500 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="text-sm font-semibold text-stone-800">{formatPrice(totalPrice)}</span>
        </div>

        {/* Timer / badges */}
        <div className="flex flex-wrap items-center gap-2">
          {isLastUnit && !expired && (
            <span className="rounded bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 border border-amber-200">
              Última unidade!
            </span>
          )}
          {item.reservedUntil && !expired && (
            <ReservationTimer
              reservedUntil={item.reservedUntil}
              onExpired={() => setExpired(true)}
            />
          )}
          {expired && (
            <span className="text-xs text-red-600 font-medium">
              Reserva expirada — disponibilidade não garantida
            </span>
          )}
          {expired && (
            <button
              onClick={() => {
                updateItem(item.variantId, qty)
                  .then(() => setExpired(false))
                  .catch(() => null);
              }}
              className="text-xs text-flor-600 underline hover:text-flor-800"
            >
              Renovar reserva
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
