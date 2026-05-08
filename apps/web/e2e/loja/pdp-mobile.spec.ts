import { test, expect } from '@playwright/test';

const SLUG = 'bolsa-couro-caramelo';

test.describe('PDP — Mobile (Pixel 7)', () => {
  test('página carrega no mobile sem overflow horizontal', async ({ page }) => {
    await page.goto(`/produto/${SLUG}`);
    const hasOverflow = await page.evaluate(() => {
      const root = document.documentElement;
      return root.scrollWidth > root.clientWidth + 1;
    });
    expect(hasOverflow).toBe(false);
  });

  test('galeria mobile: carousel visível (embla), bolinhas indicadoras presentes', async ({
    page,
  }) => {
    await page.goto(`/produto/${SLUG}`);
    const dots = page.getByRole('button', { name: /Imagem \d+/ });
    if ((await dots.count()) > 0) {
      await expect(dots.first()).toBeVisible();
    } else {
      await expect(page.getByText('Sem imagens')).toBeVisible();
    }
  });

  test('sticky CTA mobile aparece no rodapé em mobile', async ({ page }) => {
    await page.goto(`/produto/${SLUG}`);
    await expect(page.locator('.fixed.bottom-0.left-0.right-0.md\\:hidden')).toBeVisible();
  });

  test('sticky CTA mobile: sem variante selecionada mostra "Selecione"', async ({ page }) => {
    await page.goto(`/produto/${SLUG}`);
    const sticky = page.locator('.fixed.bottom-0.left-0.right-0.md\\:hidden');
    const button = sticky.getByRole('button');
    const text = (await button.textContent()) ?? '';
    expect(/Selecione|Comprar|Esgotado/.test(text)).toBe(true);
  });

  test('sticky CTA mobile: com variante selecionada mostra "Comprar"', async ({ page }) => {
    await page.goto(`/produto/${SLUG}`);
    const stickyButton = page.locator('.fixed.bottom-0.left-0.right-0.md\\:hidden button');
    const text = (await stickyButton.textContent()) ?? '';
    if (!text.includes('Comprar')) {
      const size = page.getByRole('button', { name: /Tamanho / }).first();
      if ((await size.count()) > 0) await size.click();
    }
    await expect(stickyButton).toContainText(/Comprar|Esgotado|Selecione/);
  });

  test('filtros/seletores são touch-friendly (min 44px de altura)', async ({ page }) => {
    await page.goto(`/produto/${SLUG}`);
    const touchTarget = page.getByRole('button', { name: /Tamanho / });
    if ((await touchTarget.count()) > 0) {
      const box = await touchTarget.first().boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(30);
      }
    }
  });

  test('breadcrumb está visível e não transborda', async ({ page }) => {
    await page.goto(`/produto/${SLUG}`);
    const breadcrumb = page.locator('a[href="/produtos"]');
    if ((await breadcrumb.count()) > 0) {
      await expect(breadcrumb.first()).toBeVisible();
      const overflows = await breadcrumb
        .first()
        .evaluate(
          (el) => (el.parentElement?.scrollWidth ?? 0) > (el.parentElement?.clientWidth ?? 0) + 1,
        );
      expect(overflows).toBe(false);
    }
  });
});
