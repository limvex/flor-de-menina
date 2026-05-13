'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { OrderStatusTimeline } from '@/components/admin/orders/order-status-timeline';
import { OrderStatusUpdater } from '@/components/admin/orders/order-status-updater';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { adminOrdersApi } from '@/lib/api/admin-orders';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const statusLabel: Record<string, string> = {
  PENDING: 'Aguardando pagamento',
  PAID: 'Pago',
  PROCESSING: 'Preparando para envio',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

const paymentMethodLabel: Record<string, string> = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão',
};

const paymentStatusLabel: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROCESS: 'Em processamento',
  APPROVED: 'Aprovado',
  REJECTED: 'Recusado',
  REFUNDED: 'Reembolsado',
  CANCELLED: 'Cancelado',
};

export default function AdminPedidoDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => adminOrdersApi.getById(id),
    enabled: Boolean(id),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/admin/pedidos"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            '-ml-2 text-flor-700 inline-flex items-center',
          )}
        >
          <ArrowLeft className="size-4 mr-1" />
          Pedidos
        </Link>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-flor-100 py-12 text-center text-sm text-flor-400">
          Carregando pedido…
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Pedido não encontrado ou sem permissão.
        </div>
      )}

      {data && !isLoading && (
        <>
          <AdminPageHeader
            title={data.number}
            description={`${statusLabel[data.status] ?? data.status} · ${new Date(data.createdAt).toLocaleString('pt-BR')}`}
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <OrderStatusTimeline status={data.status} />
            <OrderStatusUpdater orderId={data.id} orderStatus={data.status} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-flor-100 bg-white p-4 shadow-sm">
              <h2 className="font-medium text-flor-900 mb-3">Cliente</h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Nome</dt>
                  <dd className="font-medium">{data.user.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">E-mail</dt>
                  <dd>{data.user.email}</dd>
                </div>
                {data.user.phone && (
                  <div>
                    <dt className="text-muted-foreground">Telefone</dt>
                    <dd>{data.user.phone}</dd>
                  </div>
                )}
                {data.cpf && (
                  <div>
                    <dt className="text-muted-foreground">CPF</dt>
                    <dd>{data.cpf}</dd>
                  </div>
                )}
              </dl>
            </section>

            <section className="rounded-xl border border-flor-100 bg-white p-4 shadow-sm">
              <h2 className="font-medium text-flor-900 mb-3">Valores</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="tabular-nums">{brl.format(data.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Frete</dt>
                  <dd className="tabular-nums">{brl.format(data.shippingCost)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Desconto</dt>
                  <dd className="tabular-nums">− {brl.format(data.discount)}</dd>
                </div>
                <div className="flex justify-between border-t border-flor-100 pt-2 font-medium">
                  <dt>Total</dt>
                  <dd className="tabular-nums text-flor-900">{brl.format(data.total)}</dd>
                </div>
                {data.couponCode && (
                  <p className="text-xs text-muted-foreground pt-1">Cupom: {data.couponCode}</p>
                )}
              </dl>
            </section>
          </div>

          {data.payment && (
            <section className="rounded-xl border border-flor-100 bg-white p-4 shadow-sm">
              <h2 className="font-medium text-flor-900 mb-3">Pagamento</h2>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Método</dt>
                  <dd>{paymentMethodLabel[data.payment.method] ?? data.payment.method}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>{paymentStatusLabel[data.payment.status] ?? data.payment.status}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Valor</dt>
                  <dd className="tabular-nums">{brl.format(data.payment.amount)}</dd>
                </div>
                {data.payment.paidAt && (
                  <div>
                    <dt className="text-muted-foreground">Pago em</dt>
                    <dd>{new Date(data.payment.paidAt).toLocaleString('pt-BR')}</dd>
                  </div>
                )}
                {data.payment.failureReason && (
                  <div className="sm:col-span-2 text-destructive text-xs">
                    {data.payment.failureReason}
                  </div>
                )}
              </dl>
            </section>
          )}

          {data.shipping && (
            <section className="rounded-xl border border-flor-100 bg-white p-4 shadow-sm">
              <h2 className="font-medium text-flor-900 mb-3">Envio</h2>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Serviço</dt>
                  <dd>{data.shipping.serviceName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Custo</dt>
                  <dd className="tabular-nums">{brl.format(data.shipping.cost)}</dd>
                </div>
                {data.shipping.trackingCode && (
                  <div>
                    <dt className="text-muted-foreground">Rastreio</dt>
                    <dd className="font-mono text-xs">{data.shipping.trackingCode}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          <section className="rounded-xl border border-flor-100 bg-white p-4 shadow-sm">
            <h2 className="font-medium text-flor-900 mb-3">Itens</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-flor-100 text-left text-flor-600">
                    <th className="pb-2 pr-2">Produto</th>
                    <th className="pb-2 pr-2">Variação</th>
                    <th className="pb-2 pr-2 text-right">Qtd</th>
                    <th className="pb-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((it) => (
                    <tr key={it.id} className="border-b border-flor-50 last:border-0">
                      <td className="py-2 pr-2 font-medium">{it.productName}</td>
                      <td className="py-2 pr-2 text-muted-foreground text-xs">
                        {[it.variantColor, it.variantSize].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums">{it.quantity}</td>
                      <td className="py-2 text-right tabular-nums">{brl.format(it.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {data.notes && (
            <section className="rounded-xl border border-flor-100 bg-white p-4 shadow-sm text-sm">
              <h2 className="font-medium text-flor-900 mb-2">Observações</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{data.notes}</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
