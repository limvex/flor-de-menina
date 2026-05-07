import type { Metadata } from 'next';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

export const metadata: Metadata = { title: 'Sacola — Flor de Menina' };

export default function CarrinhoPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
      <h1 className="mb-10 font-serif text-3xl font-normal tracking-[0.12em] uppercase text-flor-800">
        Minha Sacola
      </h1>
      <EmptyState
        icon={ShoppingBag}
        title="Sua sacola está vazia"
        description="Adicione produtos à sua sacola para continuar suas compras."
        action={
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-flor-600 px-8 py-3 font-sans text-xs font-medium tracking-[0.15em] uppercase text-flor-600 transition-colors hover:bg-flor-600 hover:text-white"
          >
            Continuar comprando
          </Link>
        }
      />
    </div>
  );
}
