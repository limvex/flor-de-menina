import { test, expect } from '@playwright/test';
import { loginAdmin } from '../fixtures/auth';

test.describe('Dashboard admin', () => {
  test('redireciona para login se não autenticado', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('exibe KPIs e gráfico após login', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/dashboard');
    await expect(page.getByTestId('dashboard-kpis')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Receita por dia')).toBeVisible();
    const chart = page.locator('.recharts-responsive-container');
    await expect(chart).toBeVisible();
  });

  test('troca período para Hoje', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/dashboard');
    await expect(page.getByTestId('dashboard-kpis')).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Hoje' }).click();
    await expect(page.getByTestId('dashboard-kpis')).toBeVisible();
  });
});
