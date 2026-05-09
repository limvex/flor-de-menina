import { Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@flor/types';

const steps: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'Pedido realizado' },
  { status: 'PAID', label: 'Pagamento confirmado' },
  { status: 'PROCESSING', label: 'Em separação' },
  { status: 'SHIPPED', label: 'Enviado' },
  { status: 'DELIVERED', label: 'Entregue' },
];

const statusOrder: Record<OrderStatus, number> = {
  PENDING: 0,
  PAID: 1,
  PROCESSING: 2,
  SHIPPED: 3,
  DELIVERED: 4,
  CANCELLED: -1,
  REFUNDED: -1,
};

export function OrderTimeline({ status }: { status: OrderStatus }) {
  const currentIndex = statusOrder[status] ?? 0;

  if (status === 'CANCELLED' || status === 'REFUNDED') {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        {status === 'CANCELLED' ? 'Pedido cancelado' : 'Pedido reembolsado'}
      </div>
    );
  }

  return (
    <ol className="flex items-start gap-0">
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const upcoming = i > currentIndex;
        return (
          <li key={step.status} className="flex-1 flex flex-col items-center">
            <div className="flex items-center w-full">
              <div
                className={cn(
                  'z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium',
                  done && 'border-flor-600 bg-flor-600 text-white',
                  active && 'border-flor-600 bg-white text-flor-600',
                  upcoming && 'border-stone-200 bg-white text-stone-400',
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : active ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              {i < steps.length - 1 && (
                <div className={cn('h-0.5 flex-1', done ? 'bg-flor-600' : 'bg-stone-200')} />
              )}
            </div>
            <p
              className={cn(
                'mt-1 text-center text-xs',
                upcoming ? 'text-stone-400' : 'text-stone-700',
              )}
            >
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
