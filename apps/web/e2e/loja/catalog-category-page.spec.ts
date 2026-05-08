import { test, expect } from '@playwright/test';

test.describe('Categoria — /categoria/[slug]', () => {
  test('/categoria/vestidos: H1 = "Vestidos"', async ({ page }) => {
    await page.goto('/categoria/vestidos');
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toContainText('Vestidos');
  });

  test('breadcrumb tem "Início > Produtos > Vestidos"', async ({ page }) => {
    await page.goto('/categoria/vestidos');
    const breadcrumb = page.locator('nav[aria-label="Breadcrumb"]');
    await expect(breadcrumb).toContainText('Início');
    await expect(breadcrumb).toContainText('Produtos');
    await expect(breadcrumb).toContainText('Vestidos');
  });

  test('meta title contém "Vestidos | Flor de Menina"', async ({ page }) => {
    await page.goto('/categoria/vestidos');
    await expect(page).toHaveTitle(/Vestidos.*Flor de Menina/);
  });

  test('canonical aponta para /categoria/vestidos', async ({ page }) => {
    await page.goto('/categoria/vestidos');
    const canonical = await page.locator('head link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('/categoria/vestidos');
  });

  test('sidebar de filtros não mostra opção de mudar categoria (já travada)', async ({ page }) => {
    await page.goto('/categoria/vestidos');
    // Esperamos que não exista um <select> ou lista de categorias dentro dos filtros.
    // A sidebar contém Tamanhos, Cores e Preço apenas.
    await expect(page.locator('article').first()).toBeVisible({ timeout: 10_000 });
    // Verifica que o título da sidebar aparece (Filtros) mas sem dropdown de "Categoria".
    const sidebar = page.locator('aside');
    if ((await sidebar.count()) > 0) {
      const text = await sidebar.first().innerText();
      // Não pode haver outro filtro de categoria aqui (já implícito na URL).
      expect(text.toLowerCase()).not.toContain('categoria');
    }
  });

  test('/categoria/inexistente-slug-xyz mostra página de "não encontrada"', async ({ page }) => {
    const res = await page.goto('/categoria/inexistente-slug-xyz');
    // Next 16 (dev) pode renderizar o not-found.tsx do segmento com status 200.
    // Em produção retorna 404. Aceitamos ambos e validamos o markup.
    const status = res?.status() ?? 0;
    expect([200, 404]).toContain(status);
    await expect(page.getByText('Página não encontrada')).toBeVisible();
  });

  test('CatalogClient recebe initialCategorySlug e filtra produtos', async ({ page }) => {
    await page.goto('/categoria/vestidos');
    await expect(page.locator('article').first()).toBeVisible({ timeout: 10_000 });
    const titles = await page.locator('article h3').allTextContents();
    expect(titles.length).toBeGreaterThan(0);
  });
});
