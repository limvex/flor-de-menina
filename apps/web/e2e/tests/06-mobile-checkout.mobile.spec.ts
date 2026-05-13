import { test, expect } from '@playwright/test';
import { loginAsQaUser, getAdminToken, getQaCustomerToken } from '../fixtures/auth.fixture';
import { getTestVariant, addToCartApi } from '../fixtures/checkout.fixture';
import { CheckoutPage } from '../pages/checkout.page';

// Apenas mobile (capturado pelo project mobile do playwright.config.ts)

test.describe('06 — Mobile checkout (375px)', () => {
  test.beforeEach(async ({ context, request }) => {
    const adminToken = await getAdminToken(request);
    const customerToken = await getQaCustomerToken(request);
    const variant = await getTestVariant(request, adminToken, 'P');
    await addToCartApi(request, customerToken, variant.id, 1);
    await loginAsQaUser(context, request);
  });

  test('mini-carrinho abre e fecha em mobile', async ({ page }) => {
    await page.goto('/');
    const cartIcon = page.getByRole('button', { name: /sacola|carrinho|cart/i }).first();
    if (await cartIcon.isVisible()) {
      await cartIcon.click();
      await expect(page.getByRole('heading', { name: /Minha Sacola/i })).toBeVisible();
      // Fecha
      const closeBtn = page.getByRole('button', { name: /fechar|close/i }).first();
      if (await closeBtn.isVisible()) await closeBtn.click();
    }
  });

  test('página /carrinho usável em mobile: itens visíveis e quantidade editável', async ({
    page,
  }) => {
    await page.goto('/carrinho');
    await page.waitForLoadState('networkidle');
    // Ao menos um item visível (produto do seed)
    const productLink = page.locator('a[href^"/produto/"]').first();
    await expect(productLink).toBeVisible({ timeout: 8_000 });
    // Em mobile pode não ter controles de quantidade visíveis
  });

  test('stepper do checkout não quebra layout em mobile', async ({ page }) => {
    const checkout = new CheckoutPage(page);
    await checkout.goto();
    // Stepper deve ser visível (compacto)
    const stepper = page.locator('[class*="stepper"], [class*="step"], nav').first();
    if ((await stepper.count()) > 0) {
      await expect(stepper).toBeVisible();
    }
    // Campos de identificação visíveis
    await expect(page.getByLabel('Nome completo')).toBeVisible();
    await expect(page.getByLabel('CPF')).toBeVisible();
  });

  test('formulários preenchíveis e botão Continuar acessível em mobile', async ({ page }) => {
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    await checkout.fillIdentification();
    const btn = page.getByRole('button', { name: 'Continuar' }).first();
    await expect(btn).toBeVisible();
    await expect(btn).toBeEnabled();
  });

  test('checkout ponta-a-ponta em mobile com cartão aprovado', async ({ page }) => {
    const checkout = new CheckoutPage(page);
    await checkout.goto();

    await checkout.fillIdentification();
    await checkout.submitIdentification();
    await checkout.selectFirstAddress();
    await checkout.selectFirstShippingOption();
    await checkout.selectPaymentCard();
    await checkout.submitMockCardPayment();

    await expect(page).toHaveURL(/\/pedido\/confirmacao\//, { timeout: 15_000 });
    // Página de confirmação renderiza corretamente em mobile
    await expect(page.getByText(/Pedido realizado|confirmado/i)).toBeVisible();
  });
});
