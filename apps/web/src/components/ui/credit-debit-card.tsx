'use client';

import * as React from 'react';
import { CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FlippableCreditCardProps extends React.HTMLAttributes<HTMLDivElement> {
  cardholderName: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  /** Texto curto no canto (ex.: bandeira). */
  brandLabel?: string;
  /**
   * Quando definido, controla frente/verso (ex.: foco no CVV do Bricks).
   * `undefined` = só hover/foco no próprio cartão.
   */
  backFace?: boolean;
}

const FlippableCreditCard = React.forwardRef<HTMLDivElement, FlippableCreditCardProps>(
  (
    {
      className,
      cardholderName,
      cardNumber,
      expiryDate,
      cvv,
      brandLabel = 'CARTÃO',
      backFace,
      ...props
    },
    ref,
  ) => {
    const controlled = typeof backFace === 'boolean';

    return (
      <div
        ref={ref}
        tabIndex={controlled ? -1 : 0}
        className={cn(
          'group h-40 w-64 cursor-default [perspective:1000px] outline-none',
          !controlled &&
            'focus-visible:ring-2 focus-visible:ring-[#5c4033]/40 focus-visible:ring-offset-2',
          className,
        )}
        role="img"
        aria-label={
          controlled
            ? backFace
              ? 'Verso do cartão decorativo com CVV mascarado.'
              : 'Frente do cartão decorativo.'
            : 'Cartão decorativo: passe o cursor ou foque para ver o verso.'
        }
        {...props}
      >
        <div
          className={cn(
            'relative h-full w-full rounded-xl shadow-xl transition-transform duration-700 [transform-style:preserve-3d]',
            controlled
              ? backFace
                ? '[transform:rotateY(180deg)]'
                : '[transform:rotateY(0deg)]'
              : 'group-hover:[transform:rotateY(180deg)] group-focus-within:[transform:rotateY(180deg)]',
          )}
        >
          {/* Frente */}
          <div className="absolute h-full w-full overflow-hidden rounded-xl bg-gradient-to-br from-stone-800 via-[#4a342a] to-[#2d1f16] text-stone-50 [backface-visibility:hidden]">
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/5" />
            <div className="relative flex h-full flex-col justify-between p-4">
              <div className="flex items-start justify-between gap-2">
                <CreditCard className="h-9 w-9 shrink-0 text-amber-100/90" aria-hidden />
                <p className="text-right text-[10px] font-bold tracking-widest text-amber-100/90">
                  {brandLabel}
                </p>
              </div>

              <div className="text-center font-mono text-sm leading-snug tracking-wider text-stone-100 sm:text-base">
                {cardNumber}
              </div>

              <div className="flex items-end justify-between gap-2 text-xs">
                <div className="min-w-0 text-left">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                    Portador
                  </p>
                  <p className="truncate font-mono text-sm font-medium text-stone-100">
                    {cardholderName}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                    Válido
                  </p>
                  <p className="font-mono text-sm font-medium text-stone-100">{expiryDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verso */}
          <div className="absolute h-full w-full rounded-xl bg-gradient-to-br from-stone-900 via-stone-800 to-[#1a120d] text-stone-50 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="flex h-full flex-col">
              <div className="mt-6 h-10 w-full bg-neutral-950" />
              <div className="mx-4 mt-4 flex justify-end">
                <div className="flex h-8 w-full max-w-[85%] items-center justify-end rounded-md bg-stone-200 pr-3 dark:bg-stone-600">
                  <p className="font-mono text-sm tracking-wider text-stone-900 dark:text-stone-50">
                    {cvv}
                  </p>
                </div>
              </div>
              <p className="pr-5 text-right text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                CVV
              </p>

              <div className="mt-auto flex items-center justify-end gap-2 p-4">
                <svg
                  className="h-8 w-8 shrink-0"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 48 48"
                  aria-hidden
                >
                  <path fill="#ff9800" d="M32 10A14 14 0 1 0 32 38A14 14 0 1 0 32 10Z" />
                  <path fill="#d50000" d="M16 10A14 14 0 1 0 16 38A14 14 0 1 0 16 10Z" />
                  <path
                    fill="#ff3d00"
                    d="M18,24c0,4.755,2.376,8.95,6,11.48c3.624-2.53,6-6.725,6-11.48s-2.376-8.95-6-11.48 C20.376,15.05,18,19.245,18,24z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
FlippableCreditCard.displayName = 'FlippableCreditCard';

export { FlippableCreditCard };
