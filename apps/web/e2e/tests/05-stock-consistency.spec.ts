import { test, expect } from '@playwright/test';
import { loginAsQaUser, getAdminToken, getQaCustomerToken } from '../fixtures/auth.fixture';
import {
  getTestVariant,
  addToCartApi,
  getVariantStock,
  getLastStockMovement,
} from '../fixtures/checkout.fixture';
import { CheckoutPage } from '../pages/checkout.page';

test.describe('05 — Consistência de estoque', () => {
  test('cenário A — compra aprovada (cartão) baixa estoque exato com StockMovement ONLINE_ORDER', async ({
    page,
    context,
    request,
  }) => {
    const adminToken = await getAdminToken(request);
    const customerToken = await getQaCustomerToken(request);
    const variant = await getTestVariant(request, adminToken, 'P');
    const stockBefore = await getVariantStock(request, adminToken, variant.id);

    await addToCartApi(request, customerToken, variant.id, 1);
    await loginAsQaUser(context, request);

    const checkout = new CheckoutPage(page);
    await checkout.goto();
    await checkout.fillIdentification();
    await checkout.submitIdentification();
    await checkout.selectFirstAddress();
    await checkout.selectFirstShippingOption();
    await checkout.selectPaymentCard();
    await checkout.submitMockCardPayment();

    await expect(page).toHaveURL(/\/pedido\/confirmacao\//, { timeout: 15_000 });

    const stockAfter = await getVariantStock(request, adminToken, variant.id);
    expect(stockAfter).toBe(stockBefore - 1);

    const movement = await getLastStockMovement(request, adminToken, variant.id);
    expect(movement).not.toBeNull();
    expect(movement?.type).toBe('OUT');
    expect(movement?.source).toBe('ONLINE_ORDER');
    expect(movement?.quantity).toBe(1);
  });

  test('cenário B — cartão rejeitado restaura estoque via webhook de rejeição', async ({
    page,
    context,
    request,
  }) => {
    const adminToken = await getAdminToken(request);
    const customerToken = await getQaCustomerToken(request);
    const variant = await getTestVariant(request, adminToken, 'P');
    const stockBefore = await getVariantStock(request, adminToken, variant.id);

    await addToCartApi(request, customerToken, variant.id, 1);
    await loginAsQaUser(context, request);

    const checkout = new CheckoutPage(page);
    await checkout.goto();
    await checkout.fillIdentification();
    await checkout.submitIdentification();
    await checkout.selectFirstAddress();
    await checkout.selectFirstShippingOption();
    await checkout.selectPaymentCard();
    await checkout.selectMockCardProfile('visa_fail');
    await checkout.submitMockCardPayment();

    await expect(page).toHaveURL(/\/checkout\/falha\//, { timeout: 15_000 });

    // Aguarda webhook de rejeição processar (default MOCK_WEBHOOK_CARD_DELAY_MS=2000ms)
    // e restaurar o estoque via restoreStockForOrder
    await page.waitForTimeout(5_000);

    const stockAfter = await getVariantStock(request, adminToken, variant.id);
    // Estoque deve ser idêntico ao inicial após restauração pela rejeição
    expect(stockAfter).toBe(stockBefore);
  });
});
