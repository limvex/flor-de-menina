'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/use-auth';
import { getWishlistIds, addToWishlist, removeFromWishlist } from '@/lib/api/wishlist';
import { getCustomerProfile } from '@/lib/api/customer-profile';
import type { CustomerProfile } from '@flor/types';

interface AccountContextValue {
  profile: CustomerProfile | null;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (productId: string, variantId?: string) => Promise<void>;
  refetchProfile: () => Promise<void>;
  wishlistLoading: boolean;
}

const AccountContext = createContext<AccountContextValue | null>(null);

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);

  const { data: wishlistIds = [] } = useQuery({
    queryKey: ['wishlist-ids'],
    queryFn: getWishlistIds,
    enabled: !!user,
    staleTime: 60_000,
  });

  const refetchProfile = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getCustomerProfile();
      setProfile(data);
    } catch {
      setProfile(null);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refetchProfile();
    } else {
      setProfile(null);
    }
  }, [user, refetchProfile]);

  const addMutation = useMutation({
    mutationFn: ({ productId, variantId }: { productId: string; variantId?: string }) =>
      addToWishlist(productId, variantId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist-ids'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (productId: string) => removeFromWishlist(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist-ids'] });
      const prev = queryClient.getQueryData<string[]>(['wishlist-ids']) ?? [];
      queryClient.setQueryData(
        ['wishlist-ids'],
        prev.filter((id) => id !== productId),
      );
      return { prev };
    },
    onError: (_err, _pid, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['wishlist-ids'], context.prev);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['wishlist-ids'] }),
  });

  const isInWishlist = useCallback(
    (productId: string) => wishlistIds.includes(productId),
    [wishlistIds],
  );

  const toggleWishlist = useCallback(
    async (productId: string, variantId?: string) => {
      if (!user) {
        toast.message('Faça login para salvar favoritos', {
          action: {
            label: 'Entrar',
            onClick: () => router.push(`/login?redirect=${encodeURIComponent(pathname)}`),
          },
        });
        return;
      }
      const inList = wishlistIds.includes(productId);
      try {
        if (inList) {
          await removeMutation.mutateAsync(productId);
          toast.success('Removido dos favoritos');
        } else {
          await addMutation.mutateAsync({ productId, variantId });
          toast.success('Adicionado aos favoritos');
        }
      } catch {
        toast.error('Erro ao atualizar favoritos');
      }
    },
    [user, wishlistIds, router, pathname, addMutation, removeMutation],
  );

  const wishlistLoading = addMutation.isPending || removeMutation.isPending;

  return (
    <AccountContext.Provider
      value={{ profile, isInWishlist, toggleWishlist, refetchProfile, wishlistLoading }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount(): AccountContextValue {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error('useAccount deve ser usado dentro de AccountProvider');
  return ctx;
}
