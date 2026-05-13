'use client';

import { cn } from '@/lib/utils';

const FLOW: { key: string; label: string }[] = [
  { key: 'PAID', label: 'Pago' },
  { key: 'PROCESSING', label: 'Preparando' },
  { key: 'SHIPPED', label: 'Enviado' },
  { key: 'DELIVERED', label: 'Entregue' },
];

function flowIndex(status: string): number {
  const i = FLOW.findIndex((s) => s.key === status);
  return i;
}

export function OrderStatusTimeline({ status }: { status: string }) {
  if (status === 'CANCELLED' || status === 'REFUNDED' || status === 'PENDING') {
    return (
      <div
        data-testid="order-status-timeline"
        className="rounded-xl border border-flor-100 bg-white p-4 text-sm text-muted-foreground"
      >
        {status === 'PENDING'
          ? 'Aguardando pagamento — a timeline completa aparece após confirmação do pagamento.'
          : `Pedido ${status === 'CANCELLED' ? 'cancelado' : 'reembolsado'}.`}
      </div>
    );
  }

  const currentIdx = flowIndex(status);
  const activeIdx = currentIdx === -1 ? -1 : currentIdx;

  return (
    <div
      data-testid="order-status-timeline"
      className="rounded-xl border border-flor-100 bg-white p-4 shadow-sm"
    >
      <h2 className="mb-4 font-medium text-flor-900">Andamento do pedido</h2>
      <div className="flex flex-wrap items-center gap-1 sm:gap-0">
        {FLOW.map((step, i) => {
          const done = activeIdx >= i;
          const current = activeIdx === i;
          const muted = activeIdx >= 0 && i > activeIdx;
          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center min-w-[4.5rem]">
                <div
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full border-2 text-xs font-semibold',
                    done && 'border-flor-800 bg-flor-800 text-white',
                    current && 'ring-2 ring-flor-300 ring-offset-2',
                    muted && 'border-flor-200 bg-white text-flor-400',
                  )}
                >
                  {done ? '✓' : i + 1}
                </div>
                <span
                  className={cn(
                    'mt-1.5 text-center text-[11px] leading-tight max-w-[5.5rem]',
                    muted ? 'text-flor-400' : 'text-flor-800',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < FLOW.length - 1 && (
                <div
                  className={cn(
                    'hidden sm:block h-0.5 w-6 md:w-10 -mt-6 mx-0.5 shrink-0',
                    activeIdx > i ? 'bg-flor-800' : 'bg-flor-200',
                  )}
                  aria-hidden
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
