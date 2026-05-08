import { test, expect, Page } from '@playwright/test';

/**
 * Filtros do catálogo (sidebar desktop): tamanho, cor, faixa de preço, chips.
 *
 * Os filtros são sincronizados via nuqs (replace history). A barra desktop fica
 * visível em viewport >= 1024px (Desktop Chrome 1280×800).
 */

async function waitGridReady(page: Page) {
  // Espera grid de produtos OU empty state — o que vier primeiro.
  await Promise.race([
    page.locator('article').first().waitFor({ state: 'visible' }),
    page.getByText('Nenhum produto encontrado').waitFor({ state: 'visible' }),
    page.getByText(/Nenhum resultado/).waitFor({ state: 'visible' }),
  ]);
}

test.describe('Catálogo — filtros', () => {
  test('filtra por tamanho M e atualiza a URL com ?sizes=M', async ({ page }) => {
    await page.goto('/produtos');
    await waitGridReady(page);

    const sidebar = page.locator('aside').first();
    await sidebar.getByRole('button', { name: 'M', exact: true }).first().click();

    await page.waitForURL(/sizes=M/);
    await waitGridReady(page);
    expect(page.url()).toContain('sizes=M');
  });

  test('filtra por cor e atualiza a URL com ?colors=', async ({ page }) => {
    await page.goto('/produtos');
    await waitGridReady(page);

    const sidebar = page.locator('aside').first();
    const firstColor = sidebar.locator('button[aria-label]').first();
    const colorName = await firstColor.getAttribute('aria-label');
    expect(colorName).toBeTruthy();
    await firstColor.click();

    await page.waitForURL(
      new RegExp(`colors=${encodeURIComponent(colorName!).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`),
    );
    expect(page.url()).toMatch(/colors=/);
  });

  test('filtra por faixa de preço R$200-399 e atualiza URL', async ({ page }) => {
    await page.goto('/produtos');
    await waitGridReady(page);

    await page.locator('aside').first().getByRole('button', { name: 'R$ 200 a 399' }).click();
    await page.waitForURL(/minPrice=200.*maxPrice=399|maxPrice=399.*minPrice=200/);
    await waitGridReady(page);

    // Todos os preços visíveis devem estar na faixa
    const prices = await page.locator('article span:has-text("R$")').allTextContents();
    for (const text of prices) {
      const match = text.match(/R\$\s*([\d.,]+)/);
      if (match) {
        const value = parseFloat(match[1].replace('.', '').replace(',', '.'));
        if (!isNaN(value)) {
          expect(value).toBeGreaterThanOrEqual(200);
          expect(value).toBeLessThanOrEqual(399);
        }
      }
    }
  });

  test('combina filtro de tamanho + faixa de preço (ambos aplicam)', async ({ page }) => {
    await page.goto('/produtos');
    await waitGridReady(page);

    const sidebar = page.locator('aside').first();
    await sidebar.getByRole('button', { name: 'M', exact: true }).first().click();
    await sidebar.getByRole('button', { name: 'R$ 200 a 399' }).click();

    await page.waitForURL(/sizes=M/);
    await page.waitForURL(/minPrice=200/);
    expect(page.url()).toContain('sizes=M');
    expect(page.url()).toContain('minPrice=200');
    expect(page.url()).toContain('maxPrice=399');
  });

  test('chips dos filtros ativos aparecem com X', async ({ page }) => {
    await page.goto('/produtos?sizes=M&minPrice=200&maxPrice=399');
    await waitGridReady(page);

    const tamanho = page.getByRole('button', { name: /Tamanho M/ });
    const preco = page.getByRole('button', { name: /R\$\s?200|R\$\s?200 a 399/ });
    await expect(tamanho).toBeVisible();
    await expect(preco.first()).toBeVisible();
  });

  test('clicar no X de um chip remove só aquele filtro', async ({ page }) => {
    await page.goto('/produtos?sizes=M&minPrice=200&maxPrice=399');
    await waitGridReady(page);

    const tamanhoChip = page.getByRole('button', { name: /Tamanho M/ });
    await tamanhoChip.click();
    await page.waitForURL(/minPrice=200/);
    expect(page.url()).not.toContain('sizes=M');
    expect(page.url()).toContain('minPrice=200');
  });

  test('"Limpar tudo" remove todos os filtros', async ({ page }) => {
    await page.goto('/produtos?sizes=M&minPrice=200&maxPrice=399');
    await waitGridReady(page);

    // O botão "Limpar tudo" pode estar na sidebar OU no FilterChips quando >= 2 filtros
    const limpar = page.getByRole('button', { name: 'Limpar tudo' }).first();
    await limpar.click();

    await page.waitForFunction(
      () => !location.search.includes('sizes=') && !location.search.includes('minPrice='),
    );
    expect(page.url()).not.toContain('sizes=');
    expect(page.url()).not.toContain('minPrice=');
  });

  test('CRÍTICO: URL com filtros compartilhada carrega já filtrada em nova aba', async ({
    browser,
  }) => {
    // nuqs serializa arrays com vírgula (`sizes=M,G`) — formato canônico copiado
    // pelo usuário ao compartilhar a URL.
    const context = await browser.newContext();
    const newPage = await context.newPage();
    await newPage.goto('/produtos?sizes=M,G&sort=price_asc&colors=Marrom');
    await waitGridReady(newPage);

    // O sort deve estar selecionado
    await expect(newPage.locator('select#sort')).toHaveValue('price_asc');

    // Os chips devem aparecer (Marrom também aparece como swatch — usar primeiro chip).
    await expect(newPage.getByRole('button', { name: /Tamanho M/ })).toBeVisible();
    await expect(newPage.getByRole('button', { name: /Tamanho G/ })).toBeVisible();
    await expect(newPage.getByRole('button', { name: /^Marrom$/ }).first()).toBeVisible();

    await context.close();
  });

  test('filtro por categoria não aparece na sidebar de /categoria/[slug]', async ({ page }) => {
    await page.goto('/categoria/vestidos');
    await waitGridReady(page);
    const sidebar = page.locator('aside').first();
    // Sidebar tem Tamanho/Cor/Preço — mas NÃO opção "Categoria"
    await expect(sidebar).not.toContainText('Categoria');
  });
});
