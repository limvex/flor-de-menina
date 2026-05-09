'use client';

import { use } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCustomerOrder } from '@/lib/api/customer-profile';
import { OrderStatusBadge } from '@/components/loja/conta/order-status-badge';
import { OrderTimeline } from '@/components/loja/conta/order-timeline';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/format';
import type { OrderStatus } from '@flor/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PedidoDetalhePage({ params }: PageProps) {
  const { id } = use(params);

  const {
    data: order,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['customer-order', id],
    queryFn: () => getCustomerOrder(id),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <EmptyState
          icon={Package}
          title="Pedido não encontrado"
          description="Este pedido não existe ou não pertence à sua conta."
          action={
            <Link
              href="/conta/pedidos"
              className="inline-flex items-center justify-center rounded-full border border-flor-600 px-8 py-3 font-sans text-xs font-medium tracking-[0.15em] uppercase text-flor-600 transition-colors hover:bg-flor-600 hover:text-white"
            >
              Voltar para pedidos
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/conta/pedidos" className="text-xs text-flor-600 hover:underline">
            ← Meus pedidos
          </Link>
          <h2 className="mt-1 font-serif text-xl text-flor-800">Pedido #{order.number}</h2>
          <p className="text-sm text-stone-500">
            {new Date(order.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <OrderStatusBadge status={order.status as OrderStatus} />
      </div>

      <OrderTimeline status={order.status as OrderStatus} />

      <section>
        <h3 className="mb-3 text-sm font-semibold text-stone-700 uppercase tracking-wide">Itens</h3>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex gap-4 rounded-lg border border-stone-100 p-3">
              {item.productImageUrl && (
                <img
                  src={item.productImageUrl}
                  alt={item.productName}
                  className="h-16 w-12 rounded object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-stone-900 line-clamp-1">
                  {item.productName}
                </p>
                {(item.variantSize || item.variantColor) && (
                  <p className="text-xs text-stone-500">
                    {[item.variantSize, item.variantColor].filter(Boolean).join(' · ')}
                  </p>
                )}
                <p className="text-xs text-stone-500 mt-0.5">Qtd: {item.quantity}</p>
              </div>
              <p className="text-sm font-medium text-stone-900 shrink-0">
                {formatPrice(item.subtotal)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-stone-700 uppercase tracking-wide">
          Rastreio
        </h3>
        <p className="text-sm text-stone-500">
          {order.trackingCode ?? 'Código de rastreio será adicionado após o envio'}
        </p>
      </section>

      <section className="rounded-lg border border-stone-200 p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-stone-600">Subtotal</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-stone-600">Frete</span>
          <span>{formatPrice(order.shippingCost)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-sm text-green-700">
            <span>Desconto{order.couponCode ? ` (${order.couponCode})` : ''}</span>
            <span>- {formatPrice(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm font-semibold border-t pt-2 mt-2">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-stone-700 uppercase tracking-wide">
          Endereço de entrega
        </h3>
        <div className="text-sm text-stone-700 space-y-0.5">
          <p>{order.shippingAddress.recipientName}</p>
          <p>
            {order.shippingAddress.street}, {order.shippingAddress.number}
            {order.shippingAddress.complement && `, ${order.shippingAddress.complement}`}
          </p>
          <p>
            {order.shippingAddress.neighborhood} — {order.shippingAddress.city}/
            {order.shippingAddress.state}
          </p>
          <p>{order.shippingAddress.zipCode}</p>
        </div>
      </section>
    </div>
  );
}
