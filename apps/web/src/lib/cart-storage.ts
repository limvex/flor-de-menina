const CART_KEY = 'flor_cart';

export interface LocalCartItemSnapshot {
  productName: string;
  productSlug: string;
  productImage: string;
  variantPrice: number;
  variantSize: string | null;
  variantColor: string | null;
  variantStock: number;
}

export interface LocalCartItem {
  variantId: string;
  quantity: number;
  snapshot?: LocalCartItemSnapshot;
}

function readStorage(): LocalCartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? (JSON.parse(raw) as LocalCartItem[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: LocalCartItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function getLocalCart(): LocalCartItem[] {
  return readStorage();
}

export function setLocalCart(items: LocalCartItem[]): void {
  writeStorage(items);
}

export function clearLocalCart(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CART_KEY);
}

export function addToLocalCart(
  variantId: string,
  quantity: number,
  snapshot?: LocalCartItemSnapshot,
): LocalCartItem[] {
  const items = readStorage();
  const idx = items.findIndex((i) => i.variantId === variantId);
  if (idx >= 0) {
    items[idx] = {
      ...items[idx],
      quantity: items[idx].quantity + quantity,
      snapshot: snapshot ?? items[idx].snapshot,
    };
  } else {
    items.push({ variantId, quantity, snapshot });
  }
  writeStorage(items);
  return items;
}

export function removeFromLocalCart(variantId: string): LocalCartItem[] {
  const items = readStorage().filter((i) => i.variantId !== variantId);
  writeStorage(items);
  return items;
}

export function updateLocalCartItem(variantId: string, quantity: number): LocalCartItem[] {
  const items = readStorage().map((i) => (i.variantId === variantId ? { ...i, quantity } : i));
  writeStorage(items);
  return items;
}
