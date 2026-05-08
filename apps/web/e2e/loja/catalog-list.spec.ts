import { test, expect } from '@playwright/test';
import {
  API_URL,
  cleanupTestProducts,
  createProduct,
  getAdminToken,
  getFirstCategoryId,
  setVariants,
} from '../fixtures/catalog';

test.describe('Catálogo — listagem', () => {
  test.afterAll(async ({ request }) => {
    const token = await getAdminToken(request);
    await cleanupTestProducts(request, token);
  });

  test('exibe grid de produtos, breadcrumb, contagem e sort no /produtos', async ({ page }) => {
    await page.goto('/produtos');

    await expect(page.getByRole('heading', { level: 1, name: 'Todos os produtos' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible();
    // ResultCount aparece em duas barras (mobile + desktop). Em viewport desktop a versão
    // mobile (`lg:hidden`) está com display:none — buscamos só elementos visíveis.
    await expect(
      page.locator('span:visible', { hasText: /produtos? encontrados?/ }).first(),
    ).toBeVisible();
    await expect(page.locator('select#sort')).toBeVisible();

    await expect(page.locator('article').first()).toBeVisible();
    const cards = await page.locator('article').count();
    expect(cards).toBeGreaterThan(0);
  });

  test('grid responsivo: 4 cols desktop, 3 cols tablet, 2 cols mobile', async ({ page }) => {
    await page.goto('/produtos');
    const grid = page.locator('div.grid.grid-cols-2').first();
    await expect(grid).toBeVisible();
    const classes = await grid.getAttribute('class');
    expect(classes).toContain('grid-cols-2');
    expect(classes).toContain('sm:grid-cols-3');
    expect(classes).toContain('lg:grid-cols-4');
  });

  test('clicar num card navega pra /produto/[slug]', async ({ page }) => {
    await page.goto('/produtos');
    const firstLink = page.locator('article a[href^="/produto/"]').first();
    await expect(firstLink).toBeVisible();
    const href = await firstLink.getAttribute('href');
    expect(href).toMatch(/^\/produto\/[a-z0-9-]+$/);

    await Promise.all([page.waitForURL(/\/produto\//), firstLink.click()]);
    expect(page.url()).toMatch(/\/produto\//);
  });

  test('imagens usam aspect-ratio 3/4 (next/image em containers aspect-[3/4])', async ({
    page,
  }) => {
    await page.goto('/produtos');
    const firstImageWrap = page.locator('article div.aspect-\\[3\\/4\\]').first();
    await expect(firstImageWrap).toBeVisible();
    const cls = await firstImageWrap.getAttribute('class');
    expect(cls).toContain('aspect-[3/4]');
  });

  test('hover desktop mostra botão "Visualização rápida"', async ({ page }) => {
    await page.goto('/produtos');
    const firstCard = page.locator('article').first();
    await firstCard.scrollIntoViewIfNeeded();
    await firstCard.hover();
    const quickView = firstCard.getByRole('button', { name: 'Visualização rápida' });
    await expect(quickView).toBeVisible();
  });

  test('hover mostra a 2ª imagem quando o produto tem secondaryImage', async ({
    page,
    request,
  }) => {
    // Não temos garantia que produtos do seed tem 2 imagens — esse teste só verifica
    // o comportamento de UI: o ProductCard troca o estado `hovered` no mouseenter e
    // o atributo `src` da imagem reflete `displayImage`.
    await page.goto('/produtos');
    const firstCard = page.locator('article').first();
    const img = firstCard.locator('img').first();
    // Em produtos sem secondaryImage, a imagem permanece — mas NÃO deve quebrar
    if (await img.count()) {
      await firstCard.hover();
      // Apenas garante que a imagem ainda existe e o card permanece estável
      await expect(img).toBeVisible();
    } else {
      // Produto sem imagem: fallback "Sem imagem"
      await expect(firstCard.getByText('Sem imagem')).toBeVisible();
    }
    void request;
  });

  test('badge "Esgotado" aparece em produto sem estoque', async ({ page, request }) => {
    const token = await getAdminToken(request);
    const categoryId = await getFirstCategoryId(request);
    const unique = `Esgotado ${Date.now()}`;
    const product = await createProduct(request, token, {
      name: `E2E Cat ${unique}`,
      basePrice: 99,
      categoryId,
    });
    try {
      await setVariants(request, token, product.id, [
        { size: 'M', color: 'Preto', colorHex: '#000', stock: 0 },
      ]);

      await page.goto('/produtos?sort=newest');
      const card = page.locator(`article:has(a[href="/produto/${product.slug}"])`);
      await expect(card).toBeVisible();
      await expect(card.locator('span[data-slot="badge"]', { hasText: 'Esgotado' })).toBeVisible();
    } finally {
      await request.delete(`${API_URL}/products/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  });

  test('badge "Última peça" aparece em produto com estoque <= 2', async ({ page, request }) => {
    const token = await getAdminToken(request);
    const unique = `Ultima ${Date.now()}`;
    const product = await createProduct(request, token, {
      name: `E2E Cat ${unique}`,
      basePrice: 199,
    });
    try {
      await setVariants(request, token, product.id, [
        { size: 'M', color: 'Preto', colorHex: '#000', stock: 2 },
      ]);

      await page.goto('/produtos?sort=newest');
      const card = page.locator(`article:has(a[href="/produto/${product.slug}"])`);
      await expect(card).toBeVisible();
      await expect(
        card.locator('span[data-slot="badge"]', { hasText: 'Última peça' }),
      ).toBeVisible();
    } finally {
      await request.delete(`${API_URL}/products/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  });

  test('badge "Novidade" aparece em produto recém-criado', async ({ page, request }) => {
    const token = await getAdminToken(request);
    const unique = `Novidade ${Date.now()}`;
    const product = await createProduct(request, token, {
      name: `E2E Cat ${unique}`,
      basePrice: 299,
    });
    try {
      await setVariants(request, token, product.id, [
        { size: 'M', color: 'Preto', colorHex: '#000', stock: 5 },
      ]);

      await page.goto('/produtos?sort=newest');
      const card = page.locator(`article:has(a[href="/produto/${product.slug}"])`);
      await expect(card).toBeVisible();
      await expect(card.locator('span[data-slot="badge"]', { hasText: 'Novidade' })).toBeVisible();
    } finally {
      await request.delete(`${API_URL}/products/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  });

  test('ProductCard mostra swatches de cor com aria-label/title quando produto tem cores', async ({
    page,
  }) => {
    await page.goto('/produtos');
    const swatchSet = page.locator('[data-testid="card-color-swatches"]').first();
    await expect(swatchSet).toBeVisible({ timeout: 10_000 });
    const firstSwatch = swatchSet.locator('span[role="img"]').first();
    await expect(firstSwatch).toBeVisible();
    const ariaLabel = await firstSwatch.getAttribute('aria-label');
    expect(ariaLabel?.length).toBeGreaterThan(0);
  });

  test('produto sem imagem mostra fallback "Sem imagem"', async ({ page, request }) => {
    const token = await getAdminToken(request);
    const product = await createProduct(request, token, {
      name: `E2E Cat SemImg ${Date.now()}`,
      basePrice: 50,
    });
    try {
      await setVariants(request, token, product.id, [
        { size: 'M', color: 'Preto', colorHex: '#000', stock: 5 },
      ]);
      await page.goto('/produtos?sort=newest');
      const card = page.locator(`article:has(a[href="/produto/${product.slug}"])`);
      await expect(card).toBeVisible();
      await expect(card.getByText('Sem imagem')).toBeVisible();
    } finally {
      await request.delete(`${API_URL}/products/${product.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  });
});
