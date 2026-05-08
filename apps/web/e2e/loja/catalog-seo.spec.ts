import { test, expect } from '@playwright/test';

test.describe('Catálogo — SEO', () => {
  test('/sitemap.xml retorna 200 e contém URLs de produtos e categorias', async ({ request }) => {
    const res = await request.get('http://localhost:3000/sitemap.xml');
    expect(res.status()).toBe(200);
    const xml = await res.text();
    expect(xml).toContain('<urlset');
    expect(xml).toContain('/produtos');
    expect(xml).toContain('/categoria/');
    expect(xml).toContain('/produto/');
  });

  test('/robots.txt retorna 200 e bloqueia /admin, /api, /buscar', async ({ request }) => {
    const res = await request.get('http://localhost:3000/robots.txt');
    expect(res.status()).toBe(200);
    const txt = await res.text();
    expect(txt).toMatch(/User-Agent:\s*\*/i);
    expect(txt).toContain('/admin');
    expect(txt).toContain('/api');
    expect(txt).toContain('/buscar');
    expect(txt.toLowerCase()).toContain('sitemap');
  });

  test('/produtos tem JSON-LD ItemList', async ({ page }) => {
    await page.goto('/produtos');
    const jsonLdScripts = page.locator('script[type="application/ld+json"]');
    const count = await jsonLdScripts.count();
    expect(count).toBeGreaterThan(0);

    let foundItemList = false;
    for (let i = 0; i < count; i++) {
      const txt = await jsonLdScripts.nth(i).textContent();
      if (!txt) continue;
      try {
        const parsed = JSON.parse(txt);
        if (parsed['@type'] === 'ItemList' && Array.isArray(parsed.itemListElement)) {
          foundItemList = true;
          expect(parsed.itemListElement.length).toBeGreaterThan(0);
          expect(parsed.itemListElement[0]).toHaveProperty('url');
          break;
        }
      } catch {
        // ignora JSON inválido
      }
    }
    expect(foundItemList).toBe(true);
  });

  test('/produtos tem og:title e og:description', async ({ page }) => {
    await page.goto('/produtos');
    const ogTitle = await page.locator('head meta[property="og:title"]').getAttribute('content');
    expect(ogTitle).toContain('produtos');

    const ogDescription = await page
      .locator('head meta[property="og:description"]')
      .getAttribute('content');
    expect(ogDescription).toBeTruthy();
  });

  test('/produtos tem meta canonical correta', async ({ page }) => {
    await page.goto('/produtos');
    const canonical = await page.locator('head link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('/produtos');
  });

  test('/categoria/vestidos tem canonical absoluta correta', async ({ page }) => {
    await page.goto('/categoria/vestidos');
    const canonical = await page.locator('head link[rel="canonical"]').getAttribute('href');
    expect(canonical).toContain('/categoria/vestidos');
  });
});
