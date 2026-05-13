import { type Page } from '@playwright/test';

export async function loginAdmin(page: Page) {
  await page.goto('/admin/login');
  await page.fill('input[type="email"]', 'admin@flordemenina.store');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin(?!\/login)/);
  // Aguarda a navegação de redirect completar antes de retornar
  await page.waitForLoadState('networkidle');
}
