export const PAYMENT_ERROR_MESSAGES: Record<string, string> = {
  cc_rejected_insufficient_amount: 'Saldo insuficiente no cartão',
  cc_rejected_high_risk: 'Pagamento recusado pela análise de risco',
  cc_rejected_bad_filled_security_code: 'Código de segurança (CVV) inválido',
  cc_rejected_bad_filled_date: 'Data de validade do cartão inválida',
  cc_rejected_bad_filled_other: 'Dados do cartão inválidos',
  cc_rejected_other_reason: 'Pagamento não autorizado pelo banco',
  cc_rejected_call_for_authorize: 'Banco precisa autorizar — ligue para sua operadora',
  cc_rejected_card_disabled: 'Cartão desabilitado',
  cc_rejected_duplicated_payment: 'Pagamento duplicado detectado',
};

export function translatePaymentError(code: string | null | undefined): string {
  if (!code) return 'Pagamento não autorizado';
  return PAYMENT_ERROR_MESSAGES[code] ?? 'Pagamento não autorizado pelo banco';
}
