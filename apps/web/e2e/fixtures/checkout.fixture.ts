import { type APIRequestContext } from '@playwright/test';
import { PRODUCT_SLUG } from '../global-setup';

const API = 'http://localhost:3333';

interface VariantInfo {
  id: string;
  size: string | null;
  stock: number;
  slug: string;
}

/** Retorna a primeira variante com estoque >= 1 do produto de teste. */
export async function getTestVariant(
  api: APIRequestContext,
  adminToken: string,
  size = 'P',
): Promise<VariantInfo> {
  // Primeiro: buscar ID do produto via lista
  const listRes = await api.get(`${API}/products?search=${PRODUCT_SLUG}&limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!listRes.ok()) throw new Error(`Lista de produtos falhou: ${listRes.status()}`);
  const listBody = (await listRes.json()) as {
    items?: Array<{ id: string; slug: string }>;
  };
  const productMeta = listBody.items?.find((p) => p.slug === PRODUCT_SLUG);
  if (!productMeta) throw new Error(`Produto ${PRODUCT_SLUG} não encontrado na lista`);

  // Segundo: buscar detalhes completos com variantes
  const detailRes = await api.get(`${API}/products/${productMeta.id}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!detailRes.ok()) throw new Error(`Detalhe do produto falhou: ${detailRes.status()}`);
  const product = (await detailRes.json()) as {
    id: string;
    slug: string;
    variants?: Array<{ id: string; size: string | null; stock: number }>;
  };

  if (!product.variants?.length) throw new Error(`Produto ${PRODUCT_SLUG} sem variantes`);

  const variant =
    product.variants.find((v) => v.size === size && v.stock > 0) ??
    product.variants.find((v) => v.stock > 0);

  if (!variant) throw new Error(`Nenhuma variante com estoque em ${PRODUCT_SLUG}`);
  return { ...variant, slug: PRODUCT_SLUG };
}

/** Adiciona item ao carrinho do usuário QA via API (limpa itens anteriores antes). */
export async function addToCartApi(
  api: APIRequestContext,
  customerToken: string,
  variantId: string,
  quantity = 1,
) {
  const cookieHeader = { Cookie: `flor_customer_token=${customerToken}` };

  // Limpar carrinho inteiro via DELETE /cart
  await api.delete(`${API}/cart`, { headers: cookieHeader });

  // Adicionar item via POST /cart/items
  const res = await api.post(`${API}/cart/items`, {
    headers: cookieHeader,
    data: { variantId, quantity },
  });
  if (!res.ok()) {
    throw new Error(`Falha ao adicionar ao carrinho: ${res.status()} ${await res.text()}`);
  }
}

/** Busca estoque atual de uma variante via admin API. */
export async function getVariantStock(
  api: APIRequestContext,
  adminToken: string,
  variantId: string,
): Promise<number> {
  const res = await api.get(`${API}/admin/stock/variants/${variantId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok()) throw new Error(`Estoque não encontrado: ${res.status()}`);
  const body = (await res.json()) as { stock: number };
  return body.stock;
}

/** Busca último StockMovement de uma variante. */
export async function getLastStockMovement(
  api: APIRequestContext,
  adminToken: string,
  variantId: string,
) {
  const res = await api.get(`${API}/admin/stock/variants/${variantId}/movements?limit=1`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  if (!res.ok()) throw new Error(`Movements não encontrado: ${res.status()}`);
  const body = (await res.json()) as {
    items?: Array<{ type: string; source: string; quantity: number }>;
  };
  return body.items?.[0] ?? null;
}
