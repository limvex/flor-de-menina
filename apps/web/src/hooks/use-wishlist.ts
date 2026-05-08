'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWishlistIds, addToWishlist, removeFromWishlist } from '@/lib/api/wishlist';

export function useWishlist(productId?: string) {
  const queryClient = useQueryClient();

  const { data: wishlistIds = [] } = useQuery({
    queryKey: ['wishlist-ids'],
    queryFn: getWishlistIds,
    staleTime: 60_000,
  });

  const isInWishlist = productId ? wishlistIds.includes(productId) : false;

  const addMutation = useMutation({
    mutationFn: ({ productId: pid, variantId }: { productId: string; variantId?: string }) =>
      addToWishlist(pid, variantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist-ids'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (pid: string) => removeFromWishlist(pid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist-ids'] }),
  });

  const toggleWishlist = async (data: { productId: string; variantId?: string }) => {
    if (wishlistIds.includes(data.productId)) {
      await removeMutation.mutateAsync(data.productId);
    } else {
      await addMutation.mutateAsync(data);
    }
  };

  return {
    wishlistIds,
    isInWishlist,
    toggleWishlist,
    isLoading: addMutation.isPending || removeMutation.isPending,
  };
}
