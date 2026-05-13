import { test, expect } from '@playwright/test';
import { loginAdmin } from '../fixtures/auth';

test.describe('Dashboard admin mobile', () => {
  test('gráfico renderiza em viewport estreita', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAdmin(page);
    // Aguarda o login redirecionar para /admin/dashboard
    await page.waitForURL('**/admin/dashboard', { timeout: 20000 });
    await expect(page.getByTestId('dashboard-kpis')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.recharts-responsive-container')).toBeVisible();
  });
});
