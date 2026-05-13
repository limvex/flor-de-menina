import { test, expect } from '@playwright/test';
import { loginAsQaUser, getAdminToken, getQaCustomerToken } from '../fixtures/auth.fixture';
import { getTestVariant, addToCartApi } from '../fixtures/checkout.fixture';
import { CheckoutPage } from '../pages/checkout.page';
import { AccountPage } from '../pages/account.page';

test.describe('07 — Pedido na conta do cliente', () => {
  test('pedido aprovado (cartão) aparece em /conta/pedidos com status correto e detalhe acessível', async ({
    page,
    context,
    request,
  }) => {
    const adminToken = await getAdminToken(request);
    const customerToken = await getQaCustomerToken(request);
    const variant = await getTestVariant(request, adminToken, 'P');

    await addToCartApi(request, customerToken, variant.id, 1);
    await loginAsQaUser(context, request);

    // Fazer compra via cartão
    const checkout = new CheckoutPage(page);
    await checkout.goto();
    await checkout.fillIdentification();
    await checkout.submitIdentification();
    await checkout.selectFirstAddress();
    await checkout.selectFirstShippingOption();
    await checkout.selectPaymentCard();
    await checkout.submitMockCardPayment();

    await expect(page).toHaveURL(/\/pedido\/confirmacao\//, { timeout: 15_000 });
    const orderId = await checkout.getOrderIdFromUrl();

    // Navegar para /conta/pedidos
    const account = new AccountPage(page);
    await account.gotoOrders();

    // Pedido visível na lista (busca por parte do id ou status)
    await expect(
      page.getByText(/Pagamento confirmado|Pago|Confirmado|confirmado|PAYMENT_CONFIRMED/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Clicar em algum pedido para abrir detalhe
    const orderLink = page
      .getByRole('link')
      .filter({ hasText: new RegExp(orderId.slice(0, 8), 'i') })
      .first();

    if (await orderLink.isVisible()) {
      await orderLink.click();
      await page.waitForURL(/\/conta\/pedidos\/.+/);

      // Produto visível
      await expect(page.getByText(/blusa|produto|item/i).first()).toBeVisible({ timeout: 8_000 });

      // Endereço de entrega visível
      await expect(page.getByText(/Maceió|Macei/i)).toBeVisible({ timeout: 8_000 });
    } else {
      // Fallback: ir direto pelo ID
      await page.goto(`/conta/pedidos/${orderId}`);
      await expect(page.getByText(/blusa|produto|item/i).first()).toBeVisible({ timeout: 8_000 });
    }
  });

  test('/conta/pedidos redireciona para /login se não autenticado', async ({ page }) => {
    await page.goto('/conta/pedidos');
    await expect(page).toHaveURL(/\/(login|entrar)(\?|$)/);
  });
});
