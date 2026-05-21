'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/contexts/cart-context';
import { useAuth } from '@/lib/auth/auth-context';
import { formatPrice } from '@/lib/format';
import { FreeShippingBar } from './cart/free-shipping-bar';
import { EmptyCart } from './cart/empty-cart';

export function MiniCart() {
  const { cart, isOpen, closeCart, removeItem, isLoading } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  function handleCheckout() {
    closeCart();
    if (user) {
      router.push('/checkout');
    } else {
      router.push('/login?redirect=/checkout');
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className="z-[60] flex w-full flex-col sm:max-w-md p-0"
      >
        <SheetHeader className="flex flex-row items-center justify-between border-b border-stone-100 px-6 py-4">
          <SheetTitle className="font-serif text-xl font-normal text-stone-800">
            Minha Sacola
            {cart && cart.itemCount > 0 && (
              <span className="ml-2 font-sans text-sm font-normal text-stone-400">
                ({cart.itemCount})
              </span>
            )}
          </SheetTitle>
          <button
            onClick={closeCart}
            aria-label="Fechar sacola"
            className="rounded-full p-2 text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-20 w-16 rounded flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <EmptyCart onClose={closeCart} />
          ) : (
            <ul className="divide-y divide-stone-50 px-6 py-4 space-y-3">
              {cart.items.map((item) => (
                <li key={item.id} className="flex gap-3 pt-3 first:pt-0">
                  {/* Imagem */}
                  <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden rounded">
                    {item.product.image ? (
                      <Image
                        src={item.product.image}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : (
                      <div className="h-full w-full bg-stone-100" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex flex-1 flex-col gap-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <Link
                        href={`/produto/${item.product.slug}`}
                        onClick={closeCart}
                        className="line-clamp-2 text-sm font-medium text-stone-800 hover:text-flor-700 leading-snug"
                      >
                        {item.product.name}
                      </Link>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        aria-label="Remover item"
                        className="flex-shrink-0 rounded p-0.5 text-stone-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-stone-400">{item.variant.label}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-stone-500">Qtd: {item.quantity}</span>
                      <span className="text-sm font-semibold text-stone-800">
                        {formatPrice(item.variant.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <div className="border-t border-stone-100 px-6 py-4 space-y-4">
            <FreeShippingBar
              subtotal={cart.subtotal}
              threshold={cart.freeShippingThreshold}
              remaining={cart.freeShippingRemaining}
            />

            <div className="flex justify-between font-semibold text-stone-800 text-sm">
              <span>Subtotal</span>
              <span>{formatPrice(cart.subtotal)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/carrinho"
                onClick={closeCart}
                className="flex h-11 items-center justify-center rounded-lg border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                Ver sacola
              </Link>
              <button
                type="button"
                onClick={handleCheckout}
                className="h-11 rounded-lg bg-stone-900 hover:bg-stone-800 active:bg-stone-950 text-white text-xs font-semibold transition-colors cursor-pointer shadow-sm hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
              >
                Finalizar compra
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
