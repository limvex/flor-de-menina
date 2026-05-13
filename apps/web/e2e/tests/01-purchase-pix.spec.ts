import { test, expect } from '@playwright/test';
import { loginAsQaUser, getAdminToken, getQaCustomerToken } from '../fixtures/auth.fixture';
import { getTestVariant, addToCartApi, getVariantStock } from '../fixtures/checkout.fixture';
import { CheckoutPage } from '../pages/checkout.page';
import { AccountPage } from '../pages/account.page';

test.describe('01 — Jornada completa PIX aprovado', () => {
  test('compra via PIX: Order criado → webhook → PAYMENT_CONFIRMED → pedido em /conta/pedidos', async ({
    page,
    context,
    request,
  }) => {
    const adminToken = await getAdminToken(request);
    const customerToken = await getQaCustomerToken(request);

    const variant = await getTestVariant(request, adminToken, 'P');
    const stockBefore = await getVariantStock(request, adminToken, variant.id);

    // Montar carrinho via API
    await addToCartApi(request, customerToken, variant.id, 1);

    // Logar no browser
    await loginAsQaUser(context, request);

    const checkout = new CheckoutPage(page);
    await checkout.goto();

    // Etapa 1: Identificação
    await checkout.fillIdentification();
    await checkout.submitIdentification();

    // Etapa 2: Endereço
    await checkout.selectFirstAddress();

    // Frete
    await checkout.selectFirstShippingOption();

    // Pagamento: PIX
    await checkout.selectPaymentPix();
    await checkout.generatePix();

    // Na página de aguardando PIX — aguarda redirect automático após webhook (mock ~8s)
    await checkout.waitForPixApproval(25_000);
    await checkout.expectConfirmationPage();

    const orderId = await checkout.getOrderIdFromUrl();
    expect(orderId).toBeTruthy();

    // Verificar estoque diminuiu
    const stockAfter = await getVariantStock(request, adminToken, variant.id);
    expect(stockAfter).toBe(stockBefore - 1);

    // Verificar pedido em /conta/pedidos
    const account = new AccountPage(page);
    await account.gotoOrders();
    // Busca por padrão de status confirmado/aprovado
    await expect(
      page.getByText(/Pagamento confirmado|Pago|Confirmado|confirmado/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });
});
