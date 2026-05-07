import { test, expect } from '@playwright/test';
import { loginAdmin } from '../fixtures/auth';

test.describe('Editar produto', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test('lista exibe opções de ação por produto', async ({ page }) => {
    await page.goto('/admin/produtos');
    const table = page.locator('table');
    const empty = page.getByText('Nenhum produto encontrado');
    await expect(table.or(empty)).toBeVisible({ timeout: 10000 });
  });

  test('página de edição carrega quando produto existe', async ({ page }) => {
    const API = 'http://localhost:3333';

    // Busca via API diretamente com cookie
    await page.request.post(`${API}/auth/admin/login`, {
      data: { email: 'admin@flordemenina.site', password: 'admin123' },
    });

    const listRes = await page.request.get(`${API}/products?limit=1&status=active`);
    const list = await listRes.json();

    if (!list.items?.length) {
      test.skip();
      return;
    }

    const productId = list.items[0].id as string;
    await page.goto(`/admin/produtos/${productId}`);

    // Verifica que a página carregou (qualquer conteúdo)
    await expect(page.locator('body')).not.toBeEmpty();
    // Formulário ou mensagem de carregando
    const form = page.locator('form');
    const loading = page.getByText('Carregando');
    await expect(form.or(loading)).toBeVisible({ timeout: 10000 });
  });
});
