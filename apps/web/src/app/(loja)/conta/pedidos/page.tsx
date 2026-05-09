'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCustomerOrders } from '@/lib/api/customer-profile';
import { OrderStatusBadge } from '@/components/loja/conta/order-status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/format';
import type { OrderStatus } from '@flor/types';

const statusOptions: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'PENDING', label: 'Aguardando pagamento' },
  { value: 'PAID', label: 'Pagamento confirmado' },
  { value: 'PROCESSING', label: 'Em separação' },
  { value: 'SHIPPED', label: 'Enviado' },
  { value: 'DELIVERED', label: 'Entregue' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

export default function PedidosPage() {
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['customer-orders'],
    queryFn: getCustomerOrders,
    staleTime: 30_000,
  });

  const orders = (data?.orders ?? []).filter((o) => !statusFilter || o.status === statusFilter);

  return (
    <div>
      <h2 className="mb-6 font-serif text-xl text-flor-800">Meus pedidos</h2>

      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-flor-400"
          aria-label="Filtrar por status"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Você ainda não realizou nenhum pedido"
          description="Quando você fizer seu primeiro pedido, ele aparecerá aqui."
          action={
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-flor-600 px-8 py-3 font-sans text-xs font-medium tracking-[0.15em] uppercase text-flor-600 transition-colors hover:bg-flor-600 hover:text-white"
            >
              Explorar produtos
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between rounded-lg border border-stone-200 p-4 gap-4"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-stone-900">#{order.number}</p>
                <p className="text-xs text-stone-500">
                  {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <OrderStatusBadge status={order.status as OrderStatus} />
              <p className="text-sm font-medium text-stone-900">{formatPrice(order.total)}</p>
              <Link
                href={`/conta/pedidos/${order.id}`}
                className="text-xs font-medium text-flor-600 hover:underline whitespace-nowrap"
              >
                Ver detalhes
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
