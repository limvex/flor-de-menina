/** Mensagens amigáveis para códigos de recusa do Mercado Pago / mock. */
export function mapCardFailureMessage(code: string | null | undefined): string {
  if (!code) return 'Pagamento recusado. Tente outro cartão ou método.';

  const map: Record<string, string> = {
    cc_rejected_insufficient_amount: 'Saldo ou limite insuficiente.',
    cc_rejected_high_risk: 'Pagamento não autorizado por segurança.',
    cc_rejected_other_reason: 'Cartão recusado. Verifique os dados ou use outro cartão.',
    cc_rejected_bad_filled_security_code: 'Código de segurança incorreto.',
    cc_rejected_call_for_authorize: 'Autorize a compra com o seu banco.',
    cc_rejected_card_disabled: 'Cartão inativo. Entre em contato com o banco.',
    cc_rejected_duplicated_payment: 'Pagamento duplicado.',
    cc_rejected_max_attempts: 'Limite de tentativas excedido.',
  };

  return map[code] ?? `Pagamento não autorizado (${code}).`;
}
