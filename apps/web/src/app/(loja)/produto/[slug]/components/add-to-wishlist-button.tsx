'use client';

import { Heart } from 'lucide-react';
import { useWishlist } from '@/hooks/use-wishlist';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

interface Props {
  productId: string;
  variantId?: string | null;
  isAuthenticated: boolean;
}

export function AddToWishlistButton({ productId, variantId, isAuthenticated }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { isInWishlist, toggleWishlist, isLoading } = useWishlist(productId);

  const handleClick = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    try {
      await toggleWishlist({ productId, variantId: variantId ?? undefined });
      toast.success(isInWishlist ? 'Removido dos favoritos' : 'Adicionado aos favoritos');
    } catch {
      toast.error('Erro ao atualizar favoritos');
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="h-14 w-full rounded border border-stone-300 hover:border-stone-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
      aria-label={isInWishlist ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <Heart
        className={`h-5 w-5 ${isInWishlist ? 'fill-stone-700 text-stone-700' : 'text-stone-700'}`}
      />
      <span className="text-sm font-medium text-stone-700">
        {isInWishlist ? 'Nos favoritos' : 'Favoritar'}
      </span>
    </button>
  );
}
