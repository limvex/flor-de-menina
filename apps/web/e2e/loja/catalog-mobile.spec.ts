import { test, expect } from '@playwright/test';

// Specs deste arquivo só rodam no projeto "mobile" (Pixel 7) — ver playwright.config.ts.

test.describe('Catálogo — mobile (375px / Pixel 7)', () => {
  test('grid renderiza 2 colunas no viewport mobile', async ({ page }) => {
    await page.goto('/produtos');
    const first = page.locator('article').first();
    await expect(first).toBeVisible({ timeout: 10_000 });

    // O grid usa Tailwind grid-cols-2 no mobile. Validamos comparando widths.
    const cards = await page.locator('article').all();
    if (cards.length >= 2) {
      const w1 = await cards[0].evaluate((el) => (el as HTMLElement).getBoundingClientRect().width);
      const w2 = await cards[1].evaluate((el) => (el as HTMLElement).getBoundingClientRect().width);
      // mesma largura aproximada
      expect(Math.abs(w1 - w2)).toBeLessThan(2);
      // a soma de dois cards deve ser menor que a tela (cabem lado a lado)
      const viewport = page.viewportSize();
      expect(w1 + w2).toBeLessThanOrEqual((viewport?.width ?? 1280) + 8);
    }
  });

  test('botão "Filtros" abre bottom sheet (lado=bottom)', async ({ page }) => {
    await page.goto('/produtos');
    await page.getByRole('button', { name: /Filtros/ }).click();

    const sheet = page.locator('[data-slot="sheet-content"]');
    await expect(sheet).toBeVisible();

    // Sheet vem por baixo (side="bottom") — translateY animation
    const side = await sheet.getAttribute('data-side');
    expect(side).toBe('bottom');
  });

  test('bottom sheet tem header com título "Filtros" e footer com 2 botões', async ({ page }) => {
    await page.goto('/produtos');
    await page.getByRole('button', { name: /Filtros/ }).click();

    const sheet = page.locator('[data-slot="sheet-content"]');
    await expect(sheet).toBeVisible();

    // Header sticky (shrink-0) com título
    await expect(sheet.locator('[data-slot="sheet-title"]')).toContainText('Filtros');

    // Footer com 2 botões: "Limpar" e "Ver X produtos"
    await expect(sheet.getByRole('button', { name: /Limpar/ })).toBeVisible();
    await expect(sheet.getByRole('button', { name: /Ver \d+ produtos?/ })).toBeVisible();
  });

  test('clicar "Ver X produtos" fecha o sheet', async ({ page }) => {
    await page.goto('/produtos');
    await page.getByRole('button', { name: /Filtros/ }).click();

    const sheet = page.locator('[data-slot="sheet-content"]');
    await expect(sheet).toBeVisible();

    await sheet.getByRole('button', { name: /Ver \d+ produtos?/ }).click();
    await expect(sheet).toBeHidden();
  });

  test('aplicar filtro dentro do bottom sheet atualiza a lista de produtos', async ({ page }) => {
    await page.goto('/produtos');
    await page.getByRole('button', { name: /Filtros/ }).click();

    const sheet = page.locator('[data-slot="sheet-content"]');
    await expect(sheet).toBeVisible();

    // Tenta selecionar um tamanho qualquer disponível (M se existir)
    const sizeButton = sheet.getByRole('button', { name: 'M', exact: true });
    if ((await sizeButton.count()) > 0) {
      await sizeButton.first().click();
      // Fecha o sheet
      await sheet.getByRole('button', { name: /Ver \d+ produtos?/ }).click();
      await page.waitForURL(/sizes=M/);
      expect(page.url()).toContain('sizes=M');
    }
  });

  test('grid mobile NÃO mostra sort dropdown desktop (hidden lg:flex)', async ({ page }) => {
    await page.goto('/produtos');
    // O <select id="sort"> está dentro de um container .hidden.lg:flex no mobile
    const sort = page.locator('select#sort');
    if ((await sort.count()) > 0) {
      await expect(sort).toBeHidden();
    }
  });

  test('header mostra ícone de busca acionável no mobile', async ({ page }) => {
    await page.goto('/');
    const searchBtn = page.getByRole('button', { name: 'Buscar' });
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();
    await expect(page.getByPlaceholder('Buscar produtos...')).toBeVisible();
  });
});
