import { type Page, expect } from '@playwright/test';

export class AccountPage {
  constructor(private page: Page) {}

  async gotoOrders() {
    await this.page.goto('/conta/pedidos');
    await this.page.waitForLoadState('networkidle');
  }

  async expectOrderVisible(orderIdOrPattern: string | RegExp) {
    await expect(this.page.getByText(orderIdOrPattern)).toBeVisible({ timeout: 10_000 });
  }

  async expectOrderStatus(pattern: RegExp) {
    await expect(this.page.getByText(pattern)).toBeVisible({ timeout: 10_000 });
  }

  async openOrderDetail(orderIdOrPattern: string | RegExp) {
    await this.page.getByText(orderIdOrPattern).first().click();
    await this.page.waitForURL(/\/conta\/pedidos\/.+/);
  }

  async expectProductInOrder(productName: string | RegExp) {
    await expect(this.page.getByText(productName)).toBeVisible({ timeout: 8_000 });
  }
}
