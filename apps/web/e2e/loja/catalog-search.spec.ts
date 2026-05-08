import { test, expect } from '@playwright/test';

test.describe('Catálogo — busca', () => {
  test('header tem botão de busca que abre input ao clicar', async ({ page }) => {
    await page.goto('/');
    const searchTrigger = page.getByRole('button', { name: 'Buscar' });
    await expect(searchTrigger).toBeVisible();
    await searchTrigger.click();
    const input = page.getByPlaceholder('Buscar produtos...');
    await expect(input).toBeVisible();
  });

  test('submeter busca pelo header navega pra /buscar?q=', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Buscar' }).click();
    const input = page.getByPlaceholder('Buscar produtos...');
    await input.fill('vestido');
    await input.press('Enter');
    await page.waitForURL(/\/buscar\?q=vestido/);
    expect(page.url()).toContain('/buscar?q=vestido');
  });

  test('/buscar?q=vestido mostra título "Resultados para \'vestido\'"', async ({ page }) => {
    await page.goto('/buscar?q=vestido');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Resultados para "vestido"',
    );
  });

  test('/buscar tem meta robots="noindex"', async ({ page }) => {
    await page.goto('/buscar?q=qualquercoisa');
    const robots = await page.locator('head meta[name="robots"]').getAttribute('content');
    expect(robots).toContain('noindex');
  });

  test('busca com TYPO ("vestdo") encontra produtos via pg_trgm', async ({ page }) => {
    await page.goto('/buscar?q=vestdo');
    await expect(page.locator('article').first()).toBeVisible({ timeout: 10_000 });
    const titles = await page.locator('article h3').allTextContents();
    expect(titles.some((t) => /vestido/i.test(t))).toBe(true);
  });

  test('busca sem resultado mostra empty state', async ({ page }) => {
    await page.goto('/buscar?q=xptozzzz123');
    await expect(page.getByText(/Nenhum resultado para "xptozzzz123"/)).toBeVisible();
  });

  test('busca vazia (q=) não quebra a página', async ({ page }) => {
    const response = await page.goto('/buscar?q=');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Buscar produtos');
  });
});
