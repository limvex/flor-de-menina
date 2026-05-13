import { test, expect } from '@playwright/test';
import { loginAsQaUser, getAdminToken, getQaCustomerToken } from '../fixtures/auth.fixture';
import { getTestVariant, addToCartApi } from '../fixtures/checkout.fixture';
import { CartPage } from '../pages/cart.page';
import { COUPON_CODE } from '../global-setup';

test.describe('04 — Sistema de cupons', () => {
  test.beforeEach(async ({ context, request }) => {
    const adminToken = await getAdminToken(request);
    const customerToken = await getQaCustomerToken(request);
    const variant = await getTestVariant(request, adminToken, 'P');
    await addToCartApi(request, customerToken, variant.id, 1);
    await loginAsQaUser(context, request);
  });

  test('cenário A — cupom QATEST10 aplicado no carrinho mostra desconto', async ({
    page,
    request,
  }) => {
    const cart = new CartPage(page);
    await cart.goto();

    // Capturar total sem cupom
    const subtotalEl = page
      .getByText(/Subtotal/)
      .locator('xpath=following-sibling::*')
      .first();
    const subtotalBefore = await subtotalEl.textContent();

    await cart.applyCoupon(COUPON_CODE);

    // Código aparece com indicador de válido
    await cart.expectCouponApplied(COUPON_CODE);

    // Desconto visível na página
    await expect(page.getByText(/Desconto|10%|−R\$/i)).toBeVisible({ timeout: 8_000 });

    // Total com cupom é menor
    const totalEl = page.getByText(/Total/).locator('xpath=following-sibling::*').first();
    const totalText = await totalEl.textContent();
    expect(totalText).not.toBeNull();
    // O total com desconto deve ter valor diferente do subtotal original
    expect(totalText).not.toBe(subtotalBefore);
  });

  test('cenário B — cupom persiste ao avançar para checkout', async ({ page }) => {
    const cart = new CartPage(page);
    await cart.goto();

    await cart.applyCoupon(COUPON_CODE);
    await cart.expectCouponApplied(COUPON_CODE);

    // Ir para checkout
    await cart.goToCheckout();
    await page.waitForURL('**/checkout**');

    // Código do cupom visível no resumo do checkout
    await expect(page.getByText(COUPON_CODE)).toBeVisible({ timeout: 10_000 });
  });

  test('cenário C — cupom inválido exibe mensagem de erro', async ({ page }) => {
    const cart = new CartPage(page);
    await cart.goto();

    await cart.applyCoupon('INVALIDO123XYZ');
    await cart.expectCouponError(/n[aã]o encontrado|inv[aá]lido|expirou|indispon[ií]vel/i);
  });
});
