import { test, expect } from '@playwright/test';
import { loginAsQaUser, getAdminToken, getQaCustomerToken } from '../fixtures/auth.fixture';
import { getTestVariant, addToCartApi, getVariantStock } from '../fixtures/checkout.fixture';
import { CheckoutPage } from '../pages/checkout.page';
import { AccountPage } from '../pages/account.page';

test.describe('02 — Jornada completa Cartão aprovado', () => {
  test('compra via cartão mock_tok_visa_4242: Order imediato → PAYMENT_CONFIRMED → /conta/pedidos', async ({
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

    // Cartão aprovado
    await checkout.selectPaymentCard();
    // Perfil padrão é visa_ok — sem necessidade de trocar
    await checkout.submitMockCardPayment();

    // Cartão é síncrono → redireciona direto para confirmação
    await expect(page).toHaveURL(/\/pedido\/confirmacao\//, { timeout: 15_000 });
    await checkout.expectConfirmationPage();

    const orderId = await checkout.getOrderIdFromUrl();
    expect(orderId).toBeTruthy();

    // Estoque baixou
    const stockAfter = await getVariantStock(request, adminToken, variant.id);
    expect(stockAfter).toBe(stockBefore - 1);

    // Pedido aparece na conta
    const account = new AccountPage(page);
    await account.gotoOrders();
    await expect(page.getByText(/Pagamento confirmado|Pago|Confirmado/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
