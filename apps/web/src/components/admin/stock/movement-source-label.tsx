import type { StockMovementSource } from '@flor/types';

const SOURCE_LABELS: Record<StockMovementSource, string> = {
  MANUAL_IN: 'Recebimento de fornecedor',
  MANUAL_ADJUST: 'Ajuste de inventário',
  COUNTER_SALE: 'Venda balcão',
  ONLINE_ORDER: 'Pedido online',
  ORDER_CANCELLED: 'Cancelamento de pedido',
  ORDER_REFUNDED: 'Reembolso de pedido',
  LOSS: 'Perda / Avaria',
  RETURN: 'Devolução de cliente',
};

interface Props {
  source: StockMovementSource;
}

export function MovementSourceLabel({ source }: Props) {
  return <span>{SOURCE_LABELS[source] ?? source}</span>;
}

export function getMovementSourceLabel(source: StockMovementSource): string {
  return SOURCE_LABELS[source] ?? source;
}
