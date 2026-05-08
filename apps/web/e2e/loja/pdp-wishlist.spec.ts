import { test, expect } from '@playwright/test';

const SLUG = 'bolsa-couro-caramelo';

async function loginCustomer(request: import('@playwright/test').APIRequestContext) {
  const login = await request.post('http://localhost:3333/auth/customer/google/callback', {
    data: { code: 'e2e-pdp-wishlist' },
  });
  expect(login.status()).toBe(200);
}

test.describe('Wishlist — PDP integrado', () => {
  test('coração não logado redireciona para /entrar', async ({ page }) => {
    await page.goto(`/produto/${SLUG}`);
    await page.getByRole('button', { name: /Adicionar aos favoritos|Favoritar/ }).click();
    await page.waitForURL(/\/(login|entrar)\?redirect=/);
    expect(page.url()).toContain('redirect=');
  });

  test('logado: coração começa vazio', async ({ page }) => {
    await loginCustomer(page.request);
    await page.goto(`/produto/${SLUG}`);
    await expect(
      page.getByRole('button', { name: /Adicionar aos favoritos|Favoritar/ }),
    ).toBeVisible();
  });

  test('logado: clicar no coração preenche e mostra toast "Adicionado aos favoritos"', async ({
    page,
  }) => {
    await loginCustomer(page.request);
    await page.goto('/produtos');
    await page
      .getByRole('button', { name: /Adicionar aos favoritos/ })
      .first()
      .click();
    await expect(page.getByRole('button', { name: /Remover dos favoritos/ }).first()).toBeVisible();
  });

  test('logado: clicar novamente esvazia e mostra toast "Removido dos favoritos"', async ({
    page,
  }) => {
    await loginCustomer(page.request);
    await page.goto('/produtos');
    const heart = page
      .getByRole('button', { name: /Adicionar aos favoritos|Remover dos favoritos/ })
      .first();
    await heart.click();
    await expect(page.getByRole('button', { name: /Remover dos favoritos/ }).first()).toBeVisible();
    await page
      .getByRole('button', { name: /Remover dos favoritos/ })
      .first()
      .click();
    await expect(
      page.getByRole('button', { name: /Adicionar aos favoritos/ }).first(),
    ).toBeVisible();
  });

  test('logado: heart no ProductCard na listagem /produtos também funciona', async ({ page }) => {
    await loginCustomer(page.request);
    await page.goto('/produtos');
    const heart = page
      .getByRole('button', { name: /Adicionar aos favoritos|Remover dos favoritos/ })
      .first();
    await heart.click();
    await expect(page.getByText(/Adicionado aos favoritos|Removido dos favoritos/)).toBeVisible();
  });

  test('logado: estado do coração persiste ao navegar para outro produto e voltar', async ({
    page,
  }) => {
    await loginCustomer(page.request);
    await page.goto('/produtos');
    const heart = page
      .getByRole('button', { name: /Adicionar aos favoritos|Remover dos favoritos/ })
      .first();
    await heart.click();
    await expect(page.getByRole('button', { name: /Remover dos favoritos/ }).first()).toBeVisible();
    await page.goto(`/produto/${SLUG}`);
    await page.goto('/produtos');
    await expect(
      page.getByRole('button', { name: /Adicionar aos favoritos|Remover dos favoritos/ }).first(),
    ).toBeVisible();
  });
});
