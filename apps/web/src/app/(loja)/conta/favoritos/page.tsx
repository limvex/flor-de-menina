'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getWishlist, removeFromWishlist } from '@/lib/api/wishlist';
import { WishlistProductCard } from '@/components/loja/conta/wishlist-product-card';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

export default function FavoritosPage() {
  const queryClient = useQueryClient();
  const [removing, setRemoving] = useState<Set<string>>(new Set());

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
    staleTime: 30_000,
  });

  const handleRemove = async (productId: string) => {
    setRemoving((prev) => new Set(prev).add(productId));
    const prev = queryClient.getQueryData<typeof items>(['wishlist']) ?? [];
    queryClient.setQueryData(
      ['wishlist'],
      prev.filter((i) => i.productId !== productId),
    );
    queryClient.setQueryData<string[]>(['wishlist-ids'], (ids) =>
      (ids ?? []).filter((id) => id !== productId),
    );

    try {
      await removeFromWishlist(productId);
    } catch {
      queryClient.setQueryData(['wishlist'], prev);
      queryClient.invalidateQueries({ queryKey: ['wishlist-ids'] });
      toast.error('Erro ao remover favorito');
    } finally {
      setRemoving((prev) => {
        const s = new Set(prev);
        s.delete(productId);
        return s;
      });
    }
  };

  if (isLoading) {
    return (
      <div>
        <h2 className="mb-6 font-serif text-xl text-flor-800">Favoritos</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div>
        <h2 className="mb-6 font-serif text-xl text-flor-800">Favoritos</h2>
        <EmptyState
          icon={Heart}
          title="Sua lista de favoritos está vazia"
          description="Salve produtos que você amou para encontrá-los facilmente depois."
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

  return (
    <div>
      <h2 className="mb-6 font-serif text-xl text-flor-800">
        Favoritos{' '}
        <span className="text-base font-sans font-normal text-stone-500">({items.length})</span>
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <WishlistProductCard
            key={item.id}
            item={item}
            onRemove={handleRemove}
            removing={removing.has(item.productId)}
          />
        ))}
      </div>
    </div>
  );
}
