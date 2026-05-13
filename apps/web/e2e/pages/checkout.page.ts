import { type Page, expect } from '@playwright/test';
import { QA_USER } from '../global-setup';

export class CheckoutPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/checkout');
    await this.page.waitForLoadState('networkidle');
  }

  // ── Etapa 1: Identificação ──────────────────────────────────────────────

  async fillIdentification(opts?: { name?: string; cpf?: string; phone?: string }) {
    const name = opts?.name ?? QA_USER.name;
    const cpf = opts?.cpf ?? QA_USER.cpf;
    const phone = opts?.phone ?? QA_USER.phone;

    const nameInput = this.page.getByLabel('Nome completo');
    await nameInput.clear();
    await nameInput.fill(name);

    const cpfInput = this.page.getByLabel('CPF');
    await cpfInput.clear();
    await cpfInput.fill(cpf);

    const phoneInput = this.page.getByLabel('Telefone / WhatsApp');
    await phoneInput.clear();
    await phoneInput.fill(phone);
  }

  async submitIdentification() {
    await this.page.getByRole('button', { name: 'Continuar' }).first().click();
    // Aguarda o heading principal da etapa de endereço aparecer
    await expect(this.page.getByText(/Endere[çc]o de entrega/i).first()).toBeVisible({
      timeout: 10_000,
    });
  }

  // ── Etapa 2 sub-passos ──────────────────────────────────────────────────

  async selectFirstAddress() {
    // StepAddress usa button[role="radio"] para cada endereço
    const addrCard = this.page.getByRole('radio').first();
    await addrCard.click();
    // "Continuar" dentro da seção de endereço
    await this.page.getByRole('button', { name: 'Continuar' }).click();
  }

  async waitForShippingOptions() {
    // Aguarda ao menos uma opção de frete aparecer como radio button
    await expect(
      this.page
        .getByRole('radio')
        .filter({ hasText: /PAC|SEDEX|Jadlog/i })
        .first(),
    ).toBeVisible({ timeout: 15_000 });
  }

  async selectFirstShippingOption() {
    await this.waitForShippingOptions();
    await this.page
      .getByRole('radio')
      .filter({ hasText: /PAC|SEDEX|Jadlog/i })
      .first()
      .click();
  }

  async selectPaymentPix() {
    // PaymentMethodSelector usa button com aria-pressed
    const pixBtn = this.page.getByRole('button', { name: /^PIX$/i });
    if (await pixBtn.isVisible()) {
      await pixBtn.click();
    }
    // PIX é o método padrão — não precisa clicar se já estiver selecionado
  }

  async selectPaymentCard() {
    const cardBtn = this.page.getByRole('button', { name: /Cart[ãa]o de cr[eé]dito/i });
    await cardBtn.click();
  }

  async generatePix() {
    const btn = this.page.getByRole('button', { name: /Gerar c[oó]digo PIX/i });
    await expect(btn).toBeEnabled({ timeout: 10_000 });
    await btn.click();
    await this.page.waitForURL('**/checkout/aguardando-pix**', { timeout: 20_000 });
  }

  async selectMockCardProfile(profile: 'visa_ok' | 'master_ok' | 'visa_fail') {
    const labels: Record<string, RegExp> = {
      visa_ok: /Visa 4242/i,
      master_ok: /Mastercard 5454/i,
      visa_fail: /Visa 0001/i,
    };
    // shadcn Select — o primeiro combobox dentro do painel de cartão é o "Perfil de teste"
    const triggers = this.page.getByRole('combobox');
    const count = await triggers.count();
    if (count === 0) return; // mock não disponível (NEXT_PUBLIC_MOCK_PAYMENT não true)

    const profileTrigger = triggers.first();
    await profileTrigger.click();
    await this.page.getByRole('option', { name: labels[profile] }).click();
  }

  async submitMockCardPayment() {
    // O botão só aparece se NEXT_PUBLIC_MOCK_PAYMENT=true
    const btn = this.page.getByRole('button', { name: /Simular pagamento com cart/i });
    if ((await btn.count()) > 0) {
      await expect(btn).toBeEnabled({ timeout: 10_000 });
      await btn.click();
    }
  }

  // ── Página aguardando PIX ───────────────────────────────────────────────

  async waitForPixApproval(timeoutMs = 20_000) {
    // O polling redireciona para /pedido/confirmacao quando aprovado
    await this.page.waitForURL('**/pedido/confirmacao/**', { timeout: timeoutMs });
  }

  // ── Página de confirmação ───────────────────────────────────────────────

  async expectConfirmationPage() {
    await expect(this.page).toHaveURL(/\/pedido\/confirmacao\//);
    await expect(this.page.getByRole('heading', { name: /Pedido realizado/i })).toBeVisible();
  }

  async getOrderIdFromUrl(): Promise<string> {
    const url = this.page.url();
    const match = url.match(/\/pedido\/confirmacao\/([^/?#]+)/);
    if (!match?.[1]) throw new Error(`Order ID não encontrado na URL: ${url}`);
    return match[1];
  }

  // ── Página de falha ─────────────────────────────────────────────────────

  async expectFailurePage() {
    await expect(this.page).toHaveURL(/\/checkout\/falha\//);
  }

  async expectRetryButton() {
    await expect(
      this.page
        .getByRole('button', { name: /tentar novamente|outro m[eé]todo/i })
        .or(this.page.getByRole('link', { name: /tentar novamente|voltar|carrinho/i })),
    ).toBeVisible({ timeout: 8_000 });
  }
}
