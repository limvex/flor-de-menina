import type { APIRequestContext } from '@playwright/test';

export const API_URL = 'http://localhost:3333';
export const E2E_PREFIX = 'e2e-cat';

interface AdminTokenCache {
  token: string | null;
}
const tokenCache: AdminTokenCache = { token: null };

export async function getAdminToken(api: APIRequestContext): Promise<string> {
  if (tokenCache.token) return tokenCache.token;
  const res = await api.post(`${API_URL}/auth/admin/login`, {
    data: { email: 'admin@flordemenina.site', password: 'admin123' },
  });
  if (!res.ok()) {
    throw new Error(`Falha ao logar admin: ${res.status()}`);
  }
  const body = (await res.json()) as { access_token: string };
  tokenCache.token = body.access_token;
  return body.access_token;
}

export async function getFirstCategoryId(
  api: APIRequestContext,
  slug = 'vestidos',
): Promise<string> {
  const res = await api.get(`${API_URL}/categories/${slug}`);
  if (!res.ok()) throw new Error(`Categoria ${slug} não encontrada`);
  const body = (await res.json()) as { id: string };
  return body.id;
}

export interface CreateProductInput {
  name: string;
  basePrice: number;
  categoryId?: string;
  isActive?: boolean;
  description?: string;
}

export async function createProduct(
  api: APIRequestContext,
  token: string,
  input: CreateProductInput,
): Promise<{ id: string; slug: string }> {
  const categoryId = input.categoryId ?? (await getFirstCategoryId(api));
  const res = await api.post(`${API_URL}/products`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      name: input.name,
      description: input.description ?? `Descrição E2E — ${input.name}`,
      basePrice: input.basePrice,
      categoryId,
      isActive: input.isActive ?? true,
    },
  });
  if (!res.ok()) {
    throw new Error(`Falha ao criar produto: ${res.status()} ${await res.text()}`);
  }
  return (await res.json()) as { id: string; slug: string };
}

export interface CreateVariantInput {
  size?: string | null;
  color?: string;
  colorHex?: string;
  stock: number;
}

export async function setVariants(
  api: APIRequestContext,
  token: string,
  productId: string,
  variants: CreateVariantInput[],
): Promise<void> {
  const res = await api.put(`${API_URL}/products/${productId}/variants`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      variants: variants.map((v) => ({
        sku: `E2E-${Math.random().toString(36).slice(-5).toUpperCase()}`,
        size: v.size ?? null,
        color: v.color ?? null,
        colorHex: v.colorHex ?? null,
        stock: v.stock,
        price: null,
        isActive: true,
      })),
    },
  });
  if (!res.ok()) {
    throw new Error(`Falha ao set variants: ${res.status()} ${await res.text()}`);
  }
}

export async function deleteProduct(
  api: APIRequestContext,
  token: string,
  productId: string,
): Promise<void> {
  // Soft-delete (não destrói o registro). Suficiente: lista pública filtra.
  await api.delete(`${API_URL}/products/${productId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function cleanupTestProducts(api: APIRequestContext, token: string): Promise<void> {
  // Lista produtos com slug do prefixo (admin pode listar todos via search)
  const res = await api.get(`${API_URL}/products?limit=100&search=${E2E_PREFIX}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) return;
  const body = (await res.json()) as { items: Array<{ id: string; slug: string }> };
  for (const item of body.items) {
    if (item.slug.includes(E2E_PREFIX)) {
      await deleteProduct(api, token, item.id);
    }
  }
}
