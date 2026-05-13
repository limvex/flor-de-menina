'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchAdminOrdersList } from '@/lib/api/admin-orders';

const statusLabel: Record<string, string> = {
  all: 'Todos',
  PENDING: 'Aguardando pagamento',
  PAID: 'Pago',
  PROCESSING: 'Preparando para envio',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function AdminOrdersListClient({ accessToken }: { accessToken: string }) {
  const searchParams = useSearchParams();
  const statusFromUrl = searchParams.get('status') ?? '';

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState(() => statusFromUrl || 'all');

  useEffect(() => {
    const s = searchParams.get('status') ?? '';
    setStatus(s || 'all');
    setPage(1);
  }, [searchParams]);

  const queryKey = useMemo(() => ['admin-orders', page, status], [page, status]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      fetchAdminOrdersList(accessToken, {
        page,
        pageSize: 20,
        ...(status && status !== 'all' ? { status } : {}),
      }),
    enabled: Boolean(accessToken),
  });

  const onStatusChange = useCallback((v: string) => {
    setStatus(v);
    setPage(1);
  }, []);

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={(v) => onStatusChange(v ?? 'all')}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabel).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
          Atualizar
        </Button>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-flor-100 py-12 text-center text-sm text-flor-400">
          Carregando pedidos…
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Não foi possível carregar os pedidos.
        </div>
      )}

      {data && !isLoading && (
        <>
          {data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-flor-100">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-flor-100 bg-flor-50/50 text-left text-flor-600">
                    <th className="px-4 py-3 font-medium">Número</th>
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                    <th className="px-4 py-3 font-medium">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-flor-50 last:border-0 hover:bg-flor-50/40"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/pedidos/${o.id}`}
                          className="font-medium text-flor-900 hover:underline"
                        >
                          {o.number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {o.customerName ?? o.customerEmail ?? '—'}
                      </td>
                      <td className="px-4 py-3">{statusLabel[o.status] ?? o.status}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {brl.format(o.total)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{data.total} pedido(s)</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <span className="text-sm px-2 py-1">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
