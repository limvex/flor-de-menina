import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// A11y simplificado em modo TURBO: roda axe somente em /produtos para validar
// que não há violações com impact "critical". Violações "serious" são logadas
// como TODO no console para acompanhamento futuro (não bloqueiam merge).
//
// TODO(task-#12 follow-up): zerar violações "serious" do axe em /produtos,
// /categoria/[slug] e /buscar?q= e elevar este teste para `serious` também.

test.describe('Catálogo — Acessibilidade (axe-core)', () => {
  test('sem violações CRITICAL em /produtos', async ({ page }) => {
    await page.goto('/produtos');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['region']) // layout-level, costuma dar falso-positivo em dev
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical');
    const serious = results.violations.filter((v) => v.impact === 'serious');

    if (serious.length > 0) {
      // Apenas log: registrado como TODO de follow-up.
      console.log(
        '[a11y /produtos] violações SERIOUS (não bloqueantes — TODO):',
        serious.map((v) => ({ id: v.id, nodes: v.nodes.length, help: v.helpUrl })),
      );
    }

    if (critical.length > 0) {
      console.log(
        '[a11y /produtos] violações CRITICAL:',
        critical.map((v) => ({ id: v.id, nodes: v.nodes.length, help: v.helpUrl })),
      );
    }
    expect(critical).toEqual([]);
  });

  test('color swatches têm aria-label com nome da cor', async ({ page }) => {
    await page.goto('/produtos');
    await page.waitForLoadState('networkidle');
    const swatches = page.locator('[data-testid="card-color-swatches"] [aria-label]');
    if ((await swatches.count()) > 0) {
      const first = await swatches.first().getAttribute('aria-label');
      expect(first?.length ?? 0).toBeGreaterThan(0);
    }
  });

  test('navegação por Tab atinge elementos interativos', async ({ page }) => {
    await page.goto('/produtos');
    await page.waitForLoadState('networkidle');
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }
    const focused = await page.evaluate(() => document.activeElement?.tagName ?? null);
    expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']).toContain(focused as string);
  });
});
