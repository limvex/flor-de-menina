/** Labels PT-BR canônicos para `OrderStatus` (API/Prisma). Nunca exibir enum raw na UI. */

export const ORDER_STATUS_LABELS: Record<string, string> = {
  all: 'Todos',
  PENDING: 'Aguardando pagamento',
  PAID: 'Pago',
  PROCESSING: 'Preparando envio',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

export function getStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS[status] ?? status;
}

/** Próximos status permitidos no admin (subset de ORDER_STATUS_LABELS). */
export const TRANSITION_LABELS: Record<string, string> = {
  PROCESSING: 'Preparando envio',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

export function getTransitionLabel(status: string): string {
  return TRANSITION_LABELS[status] ?? getStatusLabel(status);
}
