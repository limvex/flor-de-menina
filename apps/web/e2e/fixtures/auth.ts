import { type Page } from '@playwright/test';

export async function loginAdmin(page: Page) {
  await page.goto('/admin/login');
  await page.fill('input[type="email"]', 'admin@flordemenina.site');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin(?!\/login)/);
}
