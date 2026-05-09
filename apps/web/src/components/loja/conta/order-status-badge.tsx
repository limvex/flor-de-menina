import { Badge } from '@/components/ui/badge';
import type { OrderStatus } from '@flor/types';

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: {
    label: 'Aguardando pagamento',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  PAID: { label: 'Pagamento confirmado', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  PROCESSING: {
    label: 'Em separação',
    className: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  SHIPPED: { label: 'Enviado', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  DELIVERED: { label: 'Entregue', className: 'bg-green-100 text-green-800 border-green-200' },
  CANCELLED: { label: 'Cancelado', className: 'bg-red-100 text-red-800 border-red-200' },
  REFUNDED: { label: 'Reembolsado', className: 'bg-stone-100 text-stone-700 border-stone-200' },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, className } = statusConfig[status] ?? statusConfig.PENDING;
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
