import { test, expect } from '@playwright/test';
import { loginAdmin } from '../fixtures/auth';

test.describe('Lista de produtos', () => {
  test('redireciona para login se não autenticado', async ({ page }) => {
    await page.goto('/admin/produtos');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('exibe link novo produto autenticado', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/produtos');
    await expect(page.getByText('Novo produto')).toBeVisible({ timeout: 10000 });
  });

  test('exibe tabela ou mensagem de vazio', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/produtos');
    const table = page.locator('table');
    const empty = page.getByText('Nenhum produto encontrado');
    await expect(table.or(empty)).toBeVisible({ timeout: 10000 });
  });

  test('botão novo produto leva para /admin/produtos/novo', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/produtos');
    await page.getByText('Novo produto').click();
    await expect(page).toHaveURL(/\/admin\/produtos\/novo/);
  });
});
