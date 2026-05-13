import { type Page, expect } from '@playwright/test';

export class PdpPage {
  constructor(private page: Page) {}

  async goto(slug: string) {
    await this.page.goto(`/produto/${slug}`);
    await expect(this.page.getByRole('heading', { level: 1 })).toBeVisible();
  }

  async selectSize(size: string) {
    const btn = this.page.getByRole('button', { name: new RegExp(size, 'i') }).first();
    await btn.click();
  }

  async addToCart() {
    await this.page.getByRole('button', { name: /Adicionar à sacola/i }).click();
    // Aguarda o drawer da sacola abrir
    await expect(this.page.getByRole('heading', { name: /Minha Sacola/i })).toBeVisible();
  }

  async closeMiniCart() {
    const closeBtn = this.page.getByRole('button', { name: /fechar|close/i }).first();
    if (await closeBtn.isVisible()) await closeBtn.click();
  }
}
