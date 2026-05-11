'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { CartResponse } from '@flor/types';
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCartApi,
  mergeCart,
} from '@/lib/api/cart';
import {
  getLocalCart,
  addToLocalCart,
  removeFromLocalCart,
  updateLocalCartItem,
  clearLocalCart,
  setLocalCart,
  type LocalCartItemSnapshot,
} from '@/lib/cart-storage';
import { useAuth } from '@/lib/auth/auth-context';

interface CartContextValue {
  cart: CartResponse | null;
  isLoading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity: number, snapshot?: LocalCartItemSnapshot) => Promise<void>;
  updateItem: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function buildLocalCart(
  items: { variantId: string; quantity: number; snapshot?: LocalCartItemSnapshot }[],
): CartResponse {
  const subtotal = items.reduce((sum, i) => sum + (i.snapshot?.variantPrice ?? 0) * i.quantity, 0);
  return {
    id: 'local',
    items: items.map((i) => {
      const s = i.snapshot;
      const size = s?.variantSize ?? null;
      const color = s?.variantColor ?? null;
      const label = [size, color].filter(Boolean).join(' - ') || 'Padrão';
      return {
        id: i.variantId,
        variantId: i.variantId,
        quantity: i.quantity,
        reservedUntil: null,
        product: {
          id: '',
          name: s?.productName ?? '',
          slug: s?.productSlug ?? '',
          image: s?.productImage ?? '',
        },
        variant: {
          id: i.variantId,
          size,
          color,
          label,
          price: s?.variantPrice ?? 0,
          compareAtPrice: null,
        },
        availableStock: s?.variantStock ?? 99,
      };
    }),
    subtotal,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    nextExpiry: null,
    freeShippingThreshold: null,
    freeShippingRemaining: null,
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const prevUserId = useRef<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      const data = await getCart();
      setCart(data);
    } catch {
      setCart(null);
    }
  }, []);

  // Carrega o carrinho quando o estado de autenticação é conhecido
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      // Mescla o localStorage ao carrinho do servidor quando o usuário acaba de logar
      if (prevUserId.current === null) {
        const localItems = getLocalCart();
        if (localItems.length > 0) {
          mergeCart(localItems)
            .then(({ cart: merged, discarded }) => {
              setCart(merged);
              clearLocalCart();
              if (discarded.length > 0) {
                toast.warning(
                  `${discarded.length} item(s) não estava(m) mais disponível(is) e foram removidos da sacola.`,
                );
              }
            })
            .catch(() => fetchCart())
            .finally(() => setIsLoading(false));
        } else {
          fetchCart().finally(() => setIsLoading(false));
        }
      } else if (prevUserId.current !== user.id) {
        fetchCart().finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    } else {
      // Não logado — usa localStorage
      const items = getLocalCart();
      setCart(items.length > 0 ? buildLocalCart(items) : null);
      setIsLoading(false);
    }

    prevUserId.current = user?.id ?? null;
  }, [user, authLoading, fetchCart]);

  const addItem = useCallback(
    async (variantId: string, quantity: number, snapshot?: LocalCartItemSnapshot) => {
      if (user) {
        const prev = cart;
        try {
          const updated = await addCartItem(variantId, quantity);
          setCart(updated);
          setIsOpen(true);
        } catch (err: unknown) {
          setCart(prev);
          const msg =
            err instanceof Error ? err.message : 'Ops! Esse item não está mais disponível';
          toast.error(msg);
          throw err;
        }
      } else {
        const items = addToLocalCart(variantId, quantity, snapshot);
        setCart(buildLocalCart(items));
        setIsOpen(true);
      }
    },
    [user, cart],
  );

  const updateItem = useCallback(
    async (variantId: string, quantity: number) => {
      if (user) {
        const prev = cart;
        try {
          const updated = await updateCartItem(variantId, quantity);
          setCart(updated);
        } catch (err: unknown) {
          setCart(prev);
          const msg = err instanceof Error ? err.message : 'Não foi possível atualizar o item';
          toast.error(msg);
          throw err;
        }
      } else {
        const items = updateLocalCartItem(variantId, quantity);
        setCart(buildLocalCart(items));
      }
    },
    [user, cart],
  );

  const removeItem = useCallback(
    async (variantId: string) => {
      if (user) {
        const prev = cart;
        try {
          const updated = await removeCartItem(variantId);
          setCart(updated);
        } catch {
          setCart(prev);
          toast.error('Não foi possível remover o item');
        }
      } else {
        const items = removeFromLocalCart(variantId);
        setCart(items.length > 0 ? buildLocalCart(items) : null);
      }
    },
    [user, cart],
  );

  const clearCart = useCallback(() => {
    if (user) {
      clearCartApi().catch(() => null);
    } else {
      clearLocalCart();
    }
    setCart(null);
  }, [user]);

  // Sincroniza o localStorage no estado quando o usuário faz logout
  useEffect(() => {
    if (!user && !authLoading) {
      const items = getLocalCart();
      if (items.length > 0) {
        setCart(buildLocalCart(items));
      }
    }
  }, [user, authLoading]);

  // Mantém o localStorage sincronizado para usuários não autenticados
  useEffect(() => {
    if (!user && cart) {
      const stored = getLocalCart();
      const snapshotMap = new Map(stored.map((s) => [s.variantId, s.snapshot]));
      const items = cart.items.map((i) => ({
        variantId: i.variantId,
        quantity: i.quantity,
        snapshot: snapshotMap.get(i.variantId),
      }));
      setLocalCart(items);
    }
  }, [user, cart]);

  const itemCount = cart?.itemCount ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        updateItem,
        removeItem,
        clearCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider');
  return ctx;
}
