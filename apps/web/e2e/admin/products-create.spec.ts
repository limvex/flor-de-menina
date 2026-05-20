import { test, expect } from '@playwright/test';
import { loginAdmin } from '../fixtures/auth';

test.describe('Criar produto', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test('acessa página de novo produto', async ({ page }) => {
    await page.goto('/admin/produtos/novo');
    await expect(page.getByRole('heading', { name: 'Novo produto' })).toBeVisible({
      timeout: 10000,
    });
  });

  test('mostra erros de validação ao submeter vazio', async ({ page }) => {
    await page.goto('/admin/produtos/novo');
    await page.getByRole('button', { name: 'Salvar produto' }).first().click();
    await expect(page.getByText('Dê um nome ao produto')).toBeVisible({
      timeout: 5000,
    });
  });

  test('formula de criação tem campos obrigatórios', async ({ page }) => {
    await page.goto('/admin/produtos/novo');
    await expect(page.getByLabel(/Nome do produto/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByLabel(/Preço de venda/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Salvar produto' }).first()).toBeVisible();
  });

  test('não exibe botão de geração com IA (desabilitado temporariamente)', async ({ page }) => {
    await page.goto('/admin/produtos/novo');
    await expect(page.getByRole('button', { name: /Gerar com IA/i })).toHaveCount(0);
  });

  test('permite selecionar imagens antes de salvar', async ({ page }) => {
    await page.goto('/admin/produtos/novo');
    await expect(page.getByText(/primeira foto é a que aparece na vitrine/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('cria produto via API e verifica na lista', async ({ page }) => {
    const API = 'http://localhost:3333';

    await page.request.post(`${API}/auth/admin/login`, {
      data: { email: 'admin@flordemenina.store', password: 'admin123' },
    });
    const catsRes = await page.request.get(`${API}/categories/admin`);
    const cats = await catsRes.json();
    const catId = cats[0]?.id;
    if (!catId) {
      test.skip();
      return;
    }

    const ts = Date.now();
    const createRes = await page.request.post(`${API}/products`, {
      data: {
        name: `Vestido Playwright ${ts}`,
        description: 'Produto criado via request E2E para validar listagem.',
        basePrice: 149.9,
        categoryId: catId,
        isActive: true,
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const prod = await createRes.json();

    await page.goto('/admin/produtos');
    await expect(page.getByText(`Vestido Playwright ${ts}`)).toBeVisible({ timeout: 10000 });

    await page.request.delete(`${API}/products/${prod.id}`);
  });
});
