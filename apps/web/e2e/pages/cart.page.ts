import { type Page, expect } from '@playwright/test';

export class CartPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/carrinho');
    await this.page.waitForLoadState('networkidle');
  }

  async expectProductVisible(namePattern: RegExp | string) {
    await expect(this.page.getByText(namePattern)).toBeVisible();
  }

  async applyCoupon(code: string) {
    const removeBtn = this.page.getByRole('button', { name: /remover cupom/i });
    const input = this.page.getByPlaceholder(/cupom/i);

    // Aguarda o componente de cupom terminar de carregar (React Query pode ser lento)
    await expect(removeBtn.or(input)).toBeVisible({ timeout: 10_000 });

    if (await removeBtn.isVisible()) {
      await removeBtn.click();
      await expect(input).toBeVisible({ timeout: 8_000 });
    }

    await input.fill(code);
    await this.page.getByRole('button', { name: /Aplicar/i }).click();
  }

  async expectCouponApplied(code: string) {
    // Pode aparecer como "Desconto (QATEST10)" ou apenas "QATEST10"
    const locator = this.page.getByText(code).first();
    await expect(locator).toBeVisible({ timeout: 8_000 });
  }

  async expectCouponError(pattern: RegExp) {
    await expect(this.page.getByText(pattern)).toBeVisible({ timeout: 8_000 });
  }

  async getSubtotalText() {
    // Linha de subtotal no CartSummary
    const row = this.page
      .getByText(/Subtotal/)
      .locator('..')
      .first();
    return row.textContent();
  }

  async goToCheckout() {
    await this.page.getByRole('button', { name: /Finalizar compra/i }).click();
    await this.page.waitForURL('**/checkout**');
  }
}
