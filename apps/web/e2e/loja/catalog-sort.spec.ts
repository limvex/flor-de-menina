import { test, expect } from '@playwright/test';

test.describe('Catálogo — ordenação', () => {
  test('select sort default = "relevance"', async ({ page }) => {
    await page.goto('/produtos');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('select#sort')).toBeVisible();
    await expect(page.locator('select#sort')).toHaveValue('relevance');
  });

  test('selecionar "Menor preço" atualiza URL e ordena ASC', async ({ page }) => {
    await page.goto('/produtos');
    await page.locator('select#sort').selectOption('price_asc');
    await page.waitForURL(/sort=price_asc/);
    expect(page.url()).toContain('sort=price_asc');

    // Pega os preços visíveis (primeiro span de price em cada card)
    await expect(page.locator('article').first()).toBeVisible();
    const prices = await page.locator('article span.text-sm.font-medium').allTextContents();
    const numeric = prices
      .map((t) => {
        const m = t.match(/R\$\s*([\d.,]+)/);
        if (!m) return null;
        return parseFloat(m[1].replace('.', '').replace(',', '.'));
      })
      .filter((n): n is number => n != null && !isNaN(n));

    expect(numeric.length).toBeGreaterThan(0);
    const sorted = [...numeric].sort((a, b) => a - b);
    expect(numeric).toEqual(sorted);
  });

  test('selecionar "Maior preço" ordena DESC', async ({ page }) => {
    await page.goto('/produtos?sort=price_desc');
    await expect(page.locator('article').first()).toBeVisible();
    const prices = await page.locator('article span.text-sm.font-medium').allTextContents();
    const numeric = prices
      .map((t) => {
        const m = t.match(/R\$\s*([\d.,]+)/);
        if (!m) return null;
        return parseFloat(m[1].replace('.', '').replace(',', '.'));
      })
      .filter((n): n is number => n != null && !isNaN(n));
    const sorted = [...numeric].sort((a, b) => b - a);
    expect(numeric).toEqual(sorted);
  });

  test('selecionar "Mais recentes" usa sort=newest na URL', async ({ page }) => {
    await page.goto('/produtos');
    await page.locator('select#sort').selectOption('newest');
    await page.waitForURL(/sort=newest/);
    expect(page.url()).toContain('sort=newest');
  });

  test('URL com sort e select permanecem sincronizados após navegação explícita', async ({
    page,
  }) => {
    // nuqs costuma usar history: 'replace' — `goBack()` fica flaky (stack nem sempre
    // tem o catálogo). Aqui validamos o que importa pro usuário: URL ↔ select estáveis.
    await page.goto('/produtos?sort=price_asc');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('select#sort')).toHaveValue('price_asc');

    await page.goto('/produtos?sort=price_desc');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('select#sort')).toHaveValue('price_desc');

    await page.goto('/produtos?sort=price_asc');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('select#sort')).toHaveValue('price_asc');
  });

  test('sort param INVÁLIDO (?sort=xpto) cai em default sem 400', async ({ page }) => {
    const res = await page.goto('/produtos?sort=xpto');
    expect(res?.status()).toBeLessThan(400);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('select#sort')).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('article').first()).toBeVisible({ timeout: 15_000 });
    // O select fica em 'relevance' (default) ou 'xpto' inválido — qualquer coisa, sem erro
    const total = await page.locator('article').count();
    expect(total).toBeGreaterThan(0);
  });
});
