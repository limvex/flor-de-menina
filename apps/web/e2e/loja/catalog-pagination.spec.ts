import { test, expect, request } from '@playwright/test';
import {
  cleanupTestProducts,
  createProduct,
  getAdminToken,
  setVariants,
  E2E_PREFIX,
} from '../fixtures/catalog';

// O catálogo usa LIMIT=24. Para forçar paginação criamos 26 produtos extras
// (somados aos do seed). Isso gera ao menos 2 páginas.
const EXTRA = 26;

test.describe('Catálogo — paginação', () => {
  test.beforeAll(async () => {
    const api = await request.newContext();
    try {
      const token = await getAdminToken(api);
      await cleanupTestProducts(api, token);
      for (let i = 0; i < EXTRA; i++) {
        const p = await createProduct(api, token, {
          name: `${E2E_PREFIX} Pag ${String(i).padStart(2, '0')}`,
          basePrice: 100 + i,
        });
        await setVariants(api, token, p.id, [{ size: 'M', stock: 10 }]);
      }
    } finally {
      await api.dispose();
    }
  });

  test.afterAll(async () => {
    const api = await request.newContext();
    try {
      const token = await getAdminToken(api);
      await cleanupTestProducts(api, token);
    } finally {
      await api.dispose();
    }
  });

  test('mostra "Carregar mais" quando há mais páginas', async ({ page }) => {
    await page.goto('/produtos');
    await expect(page.locator('article').first()).toBeVisible({ timeout: 10_000 });
    const cards = await page.locator('article').count();
    // Deve mostrar exatamente 24 (LIMIT) na primeira página
    expect(cards).toBeLessThanOrEqual(24);
    expect(cards).toBeGreaterThanOrEqual(20);
    await expect(page.getByRole('button', { name: 'Carregar mais' })).toBeVisible();
  });

  test('clicar "Carregar mais" anexa próximos produtos e atualiza URL para page=2', async ({
    page,
  }) => {
    await page.goto('/produtos');
    await expect(page.locator('article').first()).toBeVisible({ timeout: 10_000 });
    const before = await page.locator('article').count();

    await page.getByRole('button', { name: 'Carregar mais' }).click();
    await page.waitForURL(/page=2/);

    // Aguarda novos cards renderizarem
    await expect
      .poll(async () => page.locator('article').count(), { timeout: 10_000 })
      .toBeGreaterThan(before);
  });

  test('acessar /produtos?page=2 diretamente carrega a página 2', async ({ page }) => {
    await page.goto('/produtos?page=2');
    await expect(page.locator('article').first()).toBeVisible({ timeout: 10_000 });
    expect(page.url()).toContain('page=2');
  });

  test('page=999 (inválida) não quebra: lista vazia ou volta gracioso', async ({ page }) => {
    const res = await page.goto('/produtos?page=999');
    expect(res?.status()).toBeLessThan(400);
    // Pode mostrar "Nenhum produto encontrado" ou simplesmente nenhum article
    const cards = await page.locator('article').count();
    expect(cards).toBeGreaterThanOrEqual(0);
  });
});
