import { test, expect } from '@playwright/test';
import { loginAdmin } from '../fixtures/auth';

test.describe('Criar produto', () => {
  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test('acessa página de novo produto', async ({ page }) => {
    await page.goto('/admin/produtos/novo');
    await expect(page.getByText('Novo produto')).toBeVisible({ timeout: 10000 });
  });

  test('mostra erros de validação ao submeter vazio', async ({ page }) => {
    await page.goto('/admin/produtos/novo');
    await page.getByRole('button', { name: 'Criar produto' }).click();
    await expect(page.getByText('Nome deve ter ao menos 3 caracteres')).toBeVisible({
      timeout: 5000,
    });
  });

  test('formula de criação tem campos obrigatórios', async ({ page }) => {
    await page.goto('/admin/produtos/novo');
    // Verifica campos principais estão presentes
    await expect(
      page.locator('input[placeholder*="Vestido"]').or(page.locator('input').first()),
    ).toBeVisible({ timeout: 5000 });
    await expect(page.locator('textarea').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Criar produto' })).toBeVisible();
  });

  test('abre modal de IA ao clicar no botão', async ({ page }) => {
    await page.goto('/admin/produtos/novo');
    await page.getByRole('button', { name: /Gerar com IA/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
  });

  test('modal IA fecha ao cancelar', async ({ page }) => {
    await page.goto('/admin/produtos/novo');
    await page.getByRole('button', { name: /Gerar com IA/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    // Fecha com ESC
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });

  test('cria produto via API e verifica na lista', async ({ page }) => {
    const API = 'http://localhost:3333';

    // Login na API
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

    // Verifica na lista admin
    await page.goto('/admin/produtos');
    await expect(page.getByText(`Vestido Playwright ${ts}`)).toBeVisible({ timeout: 10000 });

    // Limpeza
    await page.request.delete(`${API}/products/${prod.id}`);
  });
});
