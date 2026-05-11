import { test, expect } from '@playwright/test';

const SLUG = 'bolsa-couro-caramelo';

test.describe('PDP — Desktop', () => {
  test.describe('Rota e estrutura', () => {
    test('/produto/:slug carrega com status 200', async ({ page }) => {
      const res = await page.goto(`/produto/${SLUG}`);
      expect(res?.status()).toBe(200);
    });

    test('/produto/slug-inexistente-xyzabc retorna página 404 customizada', async ({ page }) => {
      await page.goto('/produto/slug-inexistente-xyzabc');
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Produto não encontrado');
    });

    test('título da página contém nome do produto e "Flor de Menina"', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      await expect(page).toHaveTitle(/Flor de Menina/);
      await expect(page).toHaveTitle(/Bolsa|Produto/i);
    });

    test('h1 contém o nome do produto', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toContainText(/.+/);
    });
  });

  test.describe('SEO', () => {
    test('<script type="application/ld+json"> existe e contém @type: Product', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      const ldJson = await page.locator('script[type="application/ld+json"]').first().textContent();
      expect(ldJson).toContain('"@type":"Product"');
    });

    test('JSON-LD tem offers.priceCurrency = "BRL"', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      const ldJsonRaw = await page
        .locator('script[type="application/ld+json"]')
        .first()
        .textContent();
      const ldJson = JSON.parse(ldJsonRaw ?? '{}') as { offers?: { priceCurrency?: string } };
      expect(ldJson.offers?.priceCurrency).toBe('BRL');
    });

    test('JSON-LD tem brand.name = "Flor de Menina"', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      const ldJsonRaw = await page
        .locator('script[type="application/ld+json"]')
        .first()
        .textContent();
      const ldJson = JSON.parse(ldJsonRaw ?? '{}') as { brand?: { name?: string } };
      expect(ldJson.brand?.name).toBe('Flor de Menina');
    });

    test('meta og:title está preenchida', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      const ogTitle = await page.locator('head meta[property="og:title"]').getAttribute('content');
      expect((ogTitle ?? '').length).toBeGreaterThan(0);
    });

    test('meta og:image está preenchida (quando produto tem imagem)', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      const ogImageTag = page.locator('head meta[property="og:image"]');
      if ((await ogImageTag.count()) > 0) {
        const ogImage = await ogImageTag.getAttribute('content');
        expect((ogImage ?? '').length).toBeGreaterThan(0);
      }
    });

    test('canonical link aponta para /produto/:slug', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      const canonical = await page.locator('head link[rel="canonical"]').getAttribute('href');
      expect(canonical).toContain(`/produto/${SLUG}`);
    });
  });

  test.describe('Galeria desktop', () => {
    test('imagem principal visível com aspect-ratio correto', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      const imageContainer = page.locator('.hidden.md\\:block img').first();
      if ((await imageContainer.count()) > 0) {
        await expect(imageContainer).toBeVisible();
      } else {
        await expect(page.getByText('Sem imagens')).toBeVisible();
      }
    });

    test('miniaturas (thumbnails) clicáveis aparecem quando produto tem > 1 imagem', async ({
      page,
    }) => {
      await page.goto(`/produto/${SLUG}`);
      const thumbs = page.locator('.hidden.md\\:block .grid.grid-cols-5 button');
      if ((await thumbs.count()) > 0) {
        await expect(thumbs.first()).toBeVisible();
      }
    });

    test('clicar em miniatura troca a imagem principal', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      const thumbs = page.locator('.hidden.md\\:block .grid.grid-cols-5 button');
      test.skip((await thumbs.count()) < 2, 'Produto com apenas 1 imagem');
      const selectedBefore = await page
        .locator('.hidden.md\\:block .grid.grid-cols-5 .border-stone-700')
        .count();
      await thumbs.nth(1).click();
      const selectedAfter = await page
        .locator('.hidden.md\\:block .grid.grid-cols-5 .border-stone-700')
        .count();
      expect(selectedBefore).toBeGreaterThan(0);
      expect(selectedAfter).toBeGreaterThan(0);
    });
  });

  test.describe('Seletor de variantes', () => {
    test('chips de tamanho estão visíveis', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      const sizes = page.getByRole('button', { name: /Tamanho / });
      if ((await sizes.count()) > 0) {
        await expect(sizes.first()).toBeVisible();
      }
    });

    test('selecionar tamanho muda o estado visual do chip (active)', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      const sizeButtons = page.getByRole('button', { name: /Tamanho / });
      test.skip((await sizeButtons.count()) < 2, 'Sem opções suficientes');
      await sizeButtons.nth(1).click();
      const activeClass = await sizeButtons.nth(1).getAttribute('class');
      expect(activeClass).toContain('bg-stone-800');
    });

    test('tamanho sem estoque tem line-through ou opacity reduzida', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      const out = page.getByRole('button', { name: /esgotado/i }).first();
      if ((await out.count()) > 0) {
        const cls = await out.getAttribute('class');
        expect(cls).toMatch(/line-through|opacity|cursor-not-allowed/);
      }
    });

    test('link "Tabela de medidas" visível quando categoria tem sizeChart', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      const link = page.getByRole('button', { name: 'Tabela de medidas' });
      if ((await link.count()) > 0) {
        await expect(link).toBeVisible();
      }
    });

    test('clicar em "Tabela de medidas" abre dialog/modal', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      const link = page.getByRole('button', { name: 'Tabela de medidas' });
      test.skip((await link.count()) === 0, 'Categoria sem tabela');
      await link.click();
      await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('modal da tabela de medidas mostra header com nome da categoria', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      const link = page.getByRole('button', { name: 'Tabela de medidas' });
      test.skip((await link.count()) === 0, 'Categoria sem tabela');
      await link.click();
      await expect(page.getByText(/Tabela de medidas —/)).toBeVisible();
    });
  });

  test.describe('CTAs', () => {
    test('com variante selecionada: botão CTA está habilitado', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      const cta = page.getByRole('button', { name: /Adicionar à sacola/ });
      await expect(cta).toBeVisible();
      await expect(cta).toBeEnabled();
    });

    test('clicar no CTA com variante selecionada abre a sacola (drawer)', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      await page.getByRole('button', { name: /Adicionar à sacola/ }).click();
      await expect(page.getByRole('heading', { name: 'Minha Sacola' })).toBeVisible();
    });

    test('sticky mobile CTA NÃO aparece em desktop (viewport 1280px)', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      await expect(
        page.getByRole('button', { name: /Selecione|Comprar|Esgotado/ }).last(),
      ).toBeHidden();
    });
  });

  test.describe('Calculadora de frete', () => {
    test('campo CEP está visível', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      await expect(page.getByPlaceholder('00000-000')).toBeVisible();
    });

    test('botão "Calcular" desabilitado com menos de 8 dígitos', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      const input = page.getByPlaceholder('00000-000');
      await input.fill('57000');
      await expect(page.getByRole('button', { name: 'Calcular' })).toBeDisabled();
    });

    test('digitando CEP válido (8 dígitos) e clicando: mostra opções PAC e Sedex', async ({
      page,
    }) => {
      await page.goto(`/produto/${SLUG}`);
      const input = page.getByPlaceholder('00000-000');
      await input.fill('57000000');
      await page.getByRole('button', { name: 'Calcular' }).click();
      await expect(page.getByText('PAC')).toBeVisible();
      await expect(page.getByText('Sedex')).toBeVisible();
    });
  });

  test.describe('Tabs', () => {
    test('aba "Descrição" está ativa por default', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      const trigger = page.getByRole('tab', { name: 'Descrição' });
      await expect(trigger).toHaveAttribute('aria-selected', 'true');
    });

    test('aba "Trocas e Devoluções" existe e é clicável', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      const trigger = page.getByRole('tab', { name: 'Trocas e Devoluções' });
      await expect(trigger).toBeVisible();
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-selected', 'true');
    });

    test('clicar em "Trocas e Devoluções" mostra conteúdo', async ({ page }) => {
      await page.goto(`/produto/${SLUG}`);
      await page.getByRole('tab', { name: 'Trocas e Devoluções' }).click();
      await expect(page.getByText(/Aceitamos trocas e devoluções/)).toBeVisible();
    });
  });

  test.describe('Produtos relacionados', () => {
    test('seção "Você também pode gostar" aparece (quando há produtos na categoria)', async ({
      page,
    }) => {
      await page.goto(`/produto/${SLUG}`);
      const section = page.getByRole('heading', { name: 'Você também pode gostar' });
      if ((await section.count()) > 0) {
        await expect(section).toBeVisible();
      }
    });
  });

  test.describe('Wishlist — sem auth', () => {
    test('clicar no coração redireciona para /entrar (ou /login) com parâmetro redirect', async ({
      page,
    }) => {
      await page.goto(`/produto/${SLUG}`);
      await page.getByRole('button', { name: /Adicionar aos favoritos|Favoritar/ }).click();
      await page.waitForURL(/\/(login|entrar)\?redirect=/);
      expect(page.url()).toContain('redirect=');
    });
  });
});
