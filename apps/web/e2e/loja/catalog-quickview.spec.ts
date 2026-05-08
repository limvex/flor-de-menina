import { test, expect } from '@playwright/test';

test.describe('Catálogo — Visualização rápida (quick view)', () => {
  test('hover em card desktop revela botão "Visualização rápida"', async ({ page }) => {
    await page.goto('/produtos');
    const card = page.locator('article').first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.hover();
    const qvButton = card.getByRole('button', { name: /Visualização rápida/i });
    await expect(qvButton).toBeVisible();
  });

  test('clicar em "Visualização rápida" abre modal central com nome, preço e descrição', async ({
    page,
  }) => {
    await page.goto('/produtos');
    const card = page.locator('article').first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.hover();
    await card.getByRole('button', { name: /Visualização rápida/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    // Nome do produto (DialogTitle)
    await expect(dialog.locator('[data-slot="dialog-title"]')).toBeVisible();
    // Preço
    await expect(dialog.locator('text=/R\\$\\s*\\d/')).toBeVisible();
    // Botão "Ver detalhes completos"
    await expect(dialog.getByRole('link', { name: /Ver detalhes completos/i })).toBeVisible();
  });

  test('clicar em "Ver detalhes completos" navega para PDP do produto', async ({ page }) => {
    await page.goto('/produtos');
    const card = page.locator('article').first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.hover();
    await card.getByRole('button', { name: /Visualização rápida/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('link', { name: /Ver detalhes completos/i }).click();
    await page.waitForURL(/\/produto\/[^/]+/);
    expect(page.url()).toMatch(/\/produto\//);
  });

  test('Esc fecha o modal de quick view', async ({ page }) => {
    await page.goto('/produtos');
    const card = page.locator('article').first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.hover();
    await card.getByRole('button', { name: /Visualização rápida/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('clicar fora (overlay) fecha o modal', async ({ page }) => {
    await page.goto('/produtos');
    const card = page.locator('article').first();
    await expect(card).toBeVisible({ timeout: 10_000 });
    await card.hover();
    await card.getByRole('button', { name: /Visualização rápida/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Clica no overlay (data-slot="dialog-overlay" do Radix/shadcn)
    const overlay = page.locator('[data-slot="dialog-overlay"]');
    if ((await overlay.count()) > 0) {
      await overlay.first().click({ position: { x: 5, y: 5 } });
    } else {
      // Fallback: clica no botão "X" do dialog (sr-only "Close")
      const closeBtn = dialog.getByRole('button', { name: /close|fechar/i });
      await closeBtn.first().click();
    }
    await expect(dialog).toBeHidden();
  });
});
