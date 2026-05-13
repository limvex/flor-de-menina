import { request } from '@playwright/test';
import { writeFileSync } from 'fs';
import { join } from 'path';

const API = 'http://localhost:3333';

// Usa o usuário de seed já existente (emailVerified=true, CPF, endereço pré-cadastrado)
export const QA_USER = {
  email: 'pagamento@flordemenina.store',
  password: 'pagamento123',
  name: 'Cliente Pagamento MP',
  cpf: '390.533.447-05',
  phone: '(82) 99999-0003',
};
export const COUPON_CODE = 'QATEST10';
export const PRODUCT_SLUG = 'blusa-cropped-camel';

export const AUTH_CACHE_PATH = join(__dirname, '.playwright-auth-cache.json');

type Cookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  httpOnly: boolean;
  sameSite: 'Lax' | 'Strict' | 'None';
};

function parseSetCookieHeader(raw: string): Cookie[] {
  const cookies: Cookie[] = [];
  const parts = raw.split(/,(?=[^\s])/);
  for (const part of parts) {
    const segments = part.split(';').map((s) => s.trim());
    const [nameVal] = segments;
    if (!nameVal?.includes('=')) continue;
    const eqIdx = nameVal.indexOf('=');
    const name = nameVal.slice(0, eqIdx).trim();
    const value = nameVal.slice(eqIdx + 1).trim();
    if (!name || !value || value === '') continue;
    cookies.push({ name, value, domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax' });
  }
  return cookies;
}

async function getAdminToken(api: Awaited<ReturnType<typeof request.newContext>>) {
  const res = await api.post(`${API}/auth/admin/login`, {
    data: { email: 'admin@flordemenina.store', password: 'admin123' },
  });
  if (!res.ok()) throw new Error(`Admin login falhou: ${res.status()}`);
  const body = (await res.json()) as { access_token: string };
  return body.access_token;
}

export default async function globalSetup() {
  const api = await request.newContext();

  const adminToken = await getAdminToken(api);
  const headers = { Authorization: `Bearer ${adminToken}` };

  // 1. Verificar que o usuário QA consegue logar e salvar tokens em cache
  const loginRes = await api.post(`${API}/auth/customer/login`, {
    data: { email: QA_USER.email, password: QA_USER.password },
  });
  if (!loginRes.ok()) {
    throw new Error(
      `QA user login falhou: ${loginRes.status()} ${await loginRes.text()}` +
        '\n→ Rode `pnpm db:seed` para criar os usuários de teste.',
    );
  }
  console.log(`[QA setup] Usuário ${QA_USER.email} OK`);

  // Extrair e salvar tokens para evitar rate limit nos workers dos testes
  const raw = loginRes.headers()['set-cookie'] ?? '';
  const customerCookies = parseSetCookieHeader(raw);
  const customerToken = raw.match(/flor_customer_token=([^;]+)/)?.[1] ?? '';
  writeFileSync(AUTH_CACHE_PATH, JSON.stringify({ customerToken, customerCookies, adminToken }));

  // 2. Garantir cupom QATEST10 com maxUsesPerCustomer alto para testes repetidos
  const couponsRes = await api.get(`${API}/admin/coupons?search=${COUPON_CODE}`, { headers });
  const couponsBody = couponsRes.ok()
    ? ((await couponsRes.json()) as { data?: Array<{ id: string; code: string }> })
    : { data: [] };
  const existingCoupon = couponsBody.data?.find((c) => c.code === COUPON_CODE);

  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  if (existingCoupon) {
    // Atualiza para garantir que o QA user possa usar o cupom múltiplas vezes
    const updateRes = await api.patch(`${API}/admin/coupons/${existingCoupon.id}`, {
      headers,
      data: {
        maxUsesPerCustomer: 100,
        isActive: true,
        validUntil: validUntil.toISOString(),
      },
    });
    if (!updateRes.ok()) {
      console.warn(`[QA setup] Cupom update: ${updateRes.status()} ${await updateRes.text()}`);
    } else {
      console.log(`[QA setup] Cupom ${COUPON_CODE} atualizado (maxUsesPerCustomer=100)`);
    }
  } else {
    const createRes = await api.post(`${API}/admin/coupons`, {
      headers,
      data: {
        code: COUPON_CODE,
        type: 'PERCENTAGE',
        value: 10,
        isActive: true,
        validFrom: new Date().toISOString(),
        validUntil: validUntil.toISOString(),
        maxUsesPerCustomer: 100,
      },
    });
    if (!createRes.ok()) {
      console.warn(`[QA setup] Cupom criação: ${createRes.status()} ${await createRes.text()}`);
    } else {
      console.log(`[QA setup] Cupom ${COUPON_CODE} criado`);
    }
  }

  // 3. Garantir estoque mínimo para o produto de teste
  const prodListRes = await api.get(`${API}/products?search=${PRODUCT_SLUG}&limit=5`, { headers });
  if (prodListRes.ok()) {
    const listBody = (await prodListRes.json()) as { items?: Array<{ id: string; slug: string }> };
    const productMeta = listBody.items?.find((p) => p.slug === PRODUCT_SLUG);

    if (productMeta) {
      const detailRes = await api.get(`${API}/products/${productMeta.id}`, { headers });
      if (detailRes.ok()) {
        const product = (await detailRes.json()) as {
          variants?: Array<{ id: string; size: string | null; stock: number }>;
        };
        for (const variant of product.variants ?? []) {
          if (variant.stock < 10) {
            const diff = 10 - variant.stock;
            const mvRes = await api.post(`${API}/admin/stock/movements`, {
              headers,
              data: {
                variantId: variant.id,
                type: 'IN',
                source: 'MANUAL_IN',
                quantity: diff,
                reason: 'QA setup restock',
              },
            });
            if (mvRes.ok()) {
              console.log(`[QA setup] Restock variante ${variant.id} (+${diff})`);
            }
          }
        }
      }
    }
  }

  await api.dispose();
  console.log('[QA setup] Completo — usuário, cupom e produto prontos');
}
