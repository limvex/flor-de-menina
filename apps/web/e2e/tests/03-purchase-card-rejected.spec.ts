import { test, expect } from '@playwright/test';
import { loginAsQaUser, getAdminToken, getQaCustomerToken } from '../fixtures/auth.fixture';
import { getTestVariant, addToCartApi, getVariantStock } from '../fixtures/checkout.fixture';
import { CheckoutPage } from '../pages/checkout.page';

test.describe('03 — Cartão rejeitado → feedback e retry', () => {
  test('mock_tok_visa_0001: falha → página de erro acionável → estoque intacto', async ({
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

    // Cartão rejeitado
    await checkout.selectPaymentCard();
    await checkout.selectMockCardProfile('visa_fail');
    await checkout.submitMockCardPayment();

    // Deve redirecionar para /checkout/falha/[id]
    await checkout.expectFailurePage();

    // Mensagem de erro acionável (não tela branca)
    await expect(page.getByText(/pagamento|recusado|falhou|problema/i).first()).toBeVisible();

    // Botão de retry ou voltar ao carrinho
    await checkout.expectRetryButton();

    // Aguarda webhook de rejeição disparar e restaurar estoque (default 2s)
    await page.waitForTimeout(5_000);
    const stockAfter = await getVariantStock(request, adminToken, variant.id);
    // Após rejeição + webhook: estoque restaurado ao valor inicial
    expect(stockAfter).toBe(stockBefore);
  });
});
