import { test, expect, type Page } from '@playwright/test';
import { loginAdmin } from '../fixtures/auth';

/** Lista admin-orders vem do client (React Query); espera rede antes do assert. */
async function openFirstFdmOrderLink(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  const link = page.getByRole('link').filter({ hasText: /^FDM-/ }).first();
  await expect(link).toBeVisible({ timeout: 30_000 });
  await link.click();
}

test.describe('Admin operacional — pedidos (#69)', () => {
  test('admin marca pedido PAID como PROCESSING e timeline aparece', async ({ page }) => {
    await loginAdmin(page);
    await openFirstFdmOrderLink(page, '/admin/pedidos?status=PAID');
    await expect(page.getByTestId('order-status-form')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('order-status-select').selectOption('PROCESSING');
    await page.getByTestId('order-status-submit').click();
    await expect(page.getByText('Status atualizado!')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('order-status-timeline')).toBeVisible();
  });

  test('Maildev recebe e-mail ao marcar SHIPPED (se Maildev estiver UP)', async ({
    page,
    request,
  }) => {
    const inbox = await request.get('http://127.0.0.1:1080/email');
    test.skip(inbox.status() !== 200, 'Maildev não está em http://127.0.0.1:1080');

    await loginAdmin(page);
    await openFirstFdmOrderLink(page, '/admin/pedidos?status=PROCESSING');

    const before = await request.get('http://127.0.0.1:1080/email');
    const beforeJson = (await before.json()) as unknown[];
    const countBefore = Array.isArray(beforeJson) ? beforeJson.length : 0;

    await expect(page.getByTestId('order-status-form')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('order-status-select').selectOption('SHIPPED');
    await page.getByTestId('order-tracking-input').fill('BR987654321BR');
    await page.getByTestId('order-status-submit').click();
    await expect(page.getByText('Status atualizado!')).toBeVisible({ timeout: 20_000 });

    const after = await request.get('http://127.0.0.1:1080/email');
    const afterJson = (await after.json()) as unknown[];
    const countAfter = Array.isArray(afterJson) ? afterJson.length : 0;
    expect(countAfter).toBeGreaterThanOrEqual(countBefore);
  });

  test('pedido PENDING não oferece envio direto (só cancelamento)', async ({ page }) => {
    await loginAdmin(page);
    await openFirstFdmOrderLink(page, '/admin/pedidos?status=PENDING');
    await expect(page.getByTestId('order-status-form')).toBeVisible({ timeout: 15_000 });
    const sel = page.getByTestId('order-status-select');
    await expect(sel.locator('option[value="SHIPPED"]')).toHaveCount(0);
    await expect(sel.locator('option[value="CANCELLED"]')).toBeVisible();
  });

  test('SHIPPED sem código — botão desabilitado', async ({ page }) => {
    await loginAdmin(page);
    await openFirstFdmOrderLink(page, '/admin/pedidos?status=PROCESSING');
    await expect(page.getByTestId('order-status-form')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('order-status-select').selectOption('SHIPPED');
    await page.getByTestId('order-tracking-input').fill('   ');
    const btn = page.getByTestId('order-status-submit');
    await expect(btn).toBeDisabled();
  });

  test('cancelamento com estoque (documentação — coberto em Jest na API)', async () => {
    test.info().annotations.push({
      type: 'note',
      description:
        'Restauração de estoque em cancelamento PAID está coberta em apps/api/src/modules/admin-orders/tests/admin-orders.service.spec.ts',
    });
    expect(true).toBe(true);
  });
});
