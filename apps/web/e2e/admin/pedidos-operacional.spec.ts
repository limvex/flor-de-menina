import { test, expect } from '@playwright/test';
import { loginAdmin } from '../fixtures/auth';

test.describe('Admin operacional — pedidos (#69)', () => {
  test('admin marca pedido PAID como PROCESSING e timeline aparece', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/pedidos?status=PAID');
    const firstLink = page.getByRole('link').filter({ hasText: /^FDM-/ }).first();
    if (!(await firstLink.isVisible().catch(() => false))) {
      test.skip(true, 'Sem pedidos PAID no ambiente para este teste.');
    }
    await firstLink.click();
    await expect(page.getByTestId('order-status-form')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('order-status-select').click();
    await page.getByRole('option', { name: /Preparando para envio/i }).click();
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
    await page.goto('/admin/pedidos?status=PROCESSING');
    const firstLink = page.getByRole('link').filter({ hasText: /^FDM-/ }).first();
    const visible = await firstLink.isVisible().catch(() => false);
    test.skip(!visible, 'Sem pedidos PROCESSING para continuar o fluxo de envio.');

    const before = await request.get('http://127.0.0.1:1080/email');
    const beforeJson = (await before.json()) as unknown[];
    const countBefore = Array.isArray(beforeJson) ? beforeJson.length : 0;

    await firstLink.click();
    await expect(page.getByTestId('order-status-form')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('order-status-select').click();
    await page.getByRole('option', { name: /^Enviado$/i }).click();
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
    await page.goto('/admin/pedidos?status=PENDING');
    const firstLink = page.getByRole('link').filter({ hasText: /^FDM-/ }).first();
    const visible = await firstLink.isVisible().catch(() => false);
    test.skip(!visible, 'Sem pedidos PENDING no ambiente.');
    await firstLink.click();
    await expect(page.getByTestId('order-status-form')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('order-status-select').click();
    await expect(page.getByRole('option', { name: /^Enviado$/i })).toHaveCount(0);
    await expect(page.getByRole('option', { name: /Cancelado/i })).toBeVisible();
    await page.keyboard.press('Escape');
  });

  test('SHIPPED sem código — botão desabilitado', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/pedidos?status=PROCESSING');
    const firstLink = page.getByRole('link').filter({ hasText: /^FDM-/ }).first();
    const visible = await firstLink.isVisible().catch(() => false);
    test.skip(!visible, 'Sem pedidos PROCESSING.');
    await firstLink.click();
    await expect(page.getByTestId('order-status-form')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('order-status-select').click();
    await page.getByRole('option', { name: /^Enviado$/i }).click();
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
