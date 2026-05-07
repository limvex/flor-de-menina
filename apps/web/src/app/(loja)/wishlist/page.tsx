import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';

export const metadata: Metadata = { title: 'Wishlist — Flor de Menina' };

export default function WishlistPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
      <h1 className="mb-10 font-serif text-3xl font-normal tracking-[0.12em] uppercase text-flor-800">
        Minha Wishlist
      </h1>
      <EmptyState
        icon={Heart}
        title="Sua wishlist está vazia"
        description="Adicione produtos que você amou para encontrá-los facilmente depois."
        action={
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-flor-600 px-8 py-3 font-sans text-xs font-medium tracking-[0.15em] uppercase text-flor-600 transition-colors hover:bg-flor-600 hover:text-white"
          >
            Explorar produtos
          </Link>
        }
      />
    </div>
  );
}
