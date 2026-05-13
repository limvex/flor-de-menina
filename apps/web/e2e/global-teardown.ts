import { request } from '@playwright/test';
import { unlinkSync, existsSync } from 'fs';
import { QA_USER, COUPON_CODE, AUTH_CACHE_PATH } from './global-setup';

const API = 'http://localhost:3333';

async function getAdminToken(api: Awaited<ReturnType<typeof request.newContext>>) {
  const res = await api.post(`${API}/auth/admin/login`, {
    data: { email: 'admin@flordemenina.store', password: 'admin123' },
  });
  if (!res.ok()) throw new Error(`Admin login falhou: ${res.status()}`);
  const body = (await res.json()) as { access_token: string };
  return body.access_token;
}

export default async function globalTeardown() {
  const api = await request.newContext();
  const token = await getAdminToken(api);
  const headers = { Authorization: `Bearer ${token}` };

  // Log de pedidos gerados pelo usuário QA (mantidos para histórico)
  const loginRes = await api.post(`${API}/auth/customer/login`, {
    data: { email: QA_USER.email, password: QA_USER.password },
  });
  if (loginRes.ok()) {
    const cookies = loginRes.headers()['set-cookie'] ?? '';
    const match = cookies.match(/flor_customer_token=([^;]+)/);
    const customerToken = match?.[1];
    if (customerToken) {
      const ordersRes = await api.get(`${API}/customer/orders`, {
        headers: { Cookie: `flor_customer_token=${customerToken}` },
      });
      if (ordersRes.ok()) {
        const orders = (await ordersRes.json()) as unknown[];
        console.log(
          `[QA teardown] ${(orders as unknown[]).length} pedido(s) do usuário QA (mantidos)`,
        );
      }
    }
  }

  // Log do cupom (usos são registros naturais — não resetar para não quebrar idempotência)
  const couponsRes = await api.get(`${API}/admin/coupons?search=${COUPON_CODE}`, { headers });
  if (couponsRes.ok()) {
    const body = (await couponsRes.json()) as {
      items?: Array<{ code: string; totalUses: number }>;
    };
    const coupon = body.items?.find((c) => c.code === COUPON_CODE);
    if (coupon) {
      console.log(`[QA teardown] Cupom ${COUPON_CODE}: ${coupon.totalUses ?? '?'} uso(s)`);
    }
  }

  await api.dispose();

  // Remover cache de autenticação gerado pelo global-setup
  if (existsSync(AUTH_CACHE_PATH)) {
    unlinkSync(AUTH_CACHE_PATH);
  }

  console.log('[QA teardown] Concluído');
}
