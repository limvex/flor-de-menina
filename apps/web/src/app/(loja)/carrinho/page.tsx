'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { CartItemRow } from '@/components/loja/cart/cart-item-row';
import { CartSummary } from '@/components/loja/cart/cart-summary';
import { EmptyCart } from '@/components/loja/cart/empty-cart';
import { useCart } from '@/contexts/cart-context';

export default function CarrinhoPage() {
  const { cart, isLoading } = useCart();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 pb-32 md:pb-12 lg:px-8">
      <h1 className="mb-8 font-serif text-3xl font-normal tracking-[0.12em] uppercase text-flor-800">
        Minha Sacola
      </h1>

      {isLoading ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ) : !cart || cart.items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Lista de itens */}
          <ul className="space-y-3">
            {cart.items.map((item) => (
              <li key={item.id}>
                <CartItemRow item={item} />
              </li>
            ))}
          </ul>

          {/* Resumo */}
          <CartSummary cart={cart} />
        </div>
      )}
    </div>
  );
}
