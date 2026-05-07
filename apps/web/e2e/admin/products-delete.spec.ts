import { test, expect } from '@playwright/test';
import { loginAdmin } from '../fixtures/auth';

test.describe('Deletar e restaurar produto', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test('produto deletado via API não aparece na listagem pública', async ({ page }) => {
    const API = 'http://localhost:3333';

    const loginRes = await page.request.post(`${API}/auth/login`, {
      data: { email: 'admin@flordemenina.site', password: 'admin123' },
    });
    const { access_token } = await loginRes.json();

    // Busca lista pública antes
    const publicBefore = await page.request.get(`${API}/products/public?limit=5`);
    const dataBefore = await publicBefore.json();

    if (dataBefore.items?.length === 0) {
      test.skip();
      return;
    }

    const product = dataBefore.items[0];
    const slug = product.slug as string;

    // Deleta
    await page.request.delete(`${API}/products/${product.id}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    // Produto não aparece no público
    const pdpRes = await page.request.get(`${API}/products/public/${slug}`);
    expect(pdpRes.status()).toBe(404);

    // Restaura (cleanup)
    await page.request.post(`${API}/products/${product.id}/restore`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
  });
});
