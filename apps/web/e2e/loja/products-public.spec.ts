import { test, expect } from '@playwright/test';

test.describe('Catálogo público', () => {
  test('API pública retorna produtos ativos', async ({ page }) => {
    const res = await page.request.get('http://localhost:3333/products/public?limit=5');
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('items');
    expect(Array.isArray(data.items)).toBe(true);
  });

  test('produto inativo não aparece no público', async ({ page }) => {
    const API = 'http://localhost:3333';
    const loginRes = await page.request.post(`${API}/auth/login`, {
      data: { email: 'admin@flordemenina.site', password: 'admin123' },
    });
    const { access_token } = await loginRes.json();

    // Cria produto inativo
    const createRes = await page.request.post(`${API}/products`, {
      headers: { Authorization: `Bearer ${access_token}` },
      data: {
        name: 'Produto Inativo E2E',
        description: 'Produto para teste, não deve aparecer no público.',
        basePrice: 50.0,
        categoryId: await getFirstCategoryId(page, API, access_token),
        isActive: false,
      },
    });

    if (!createRes.ok()) {
      test.skip();
      return;
    }

    const { slug, id } = await createRes.json();

    // Não deve aparecer
    const publicRes = await page.request.get(`${API}/products/public/${slug}`);
    expect(publicRes.status()).toBe(404);

    // Limpa
    await page.request.delete(`${API}/products/${id}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
  });

  test('GET /products/public/:slug retorna produto ativo', async ({ page }) => {
    const API = 'http://localhost:3333';
    const listRes = await page.request.get(`${API}/products/public?limit=1`);
    const { items } = await listRes.json();

    if (items?.length === 0) {
      test.skip();
      return;
    }

    const res = await page.request.get(`${API}/products/public/${items[0].slug}`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('slug', items[0].slug);
    expect(data).toHaveProperty('variants');
    expect(data).toHaveProperty('images');
  });
});

async function getFirstCategoryId(
  page: import('@playwright/test').Page,
  api: string,
  token: string,
): Promise<string> {
  const res = await page.request.get(`${api}/categories/admin`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const categories = await res.json();
  return categories[0]?.id ?? '';
}
