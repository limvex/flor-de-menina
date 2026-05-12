'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Package, ShoppingBag, Truck, AlertTriangle, Star, ChevronRight } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dashboardApi, type DashboardPreset, type DashboardSummary } from '@/lib/api/dashboard';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const orderStatusLabel: Record<string, string> = {
  PENDING: 'Aguardando pagamento',
  PAID: 'Pago',
  PROCESSING: 'Em separação',
  SHIPPED: 'Enviado',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
  REFUNDED: 'Reembolsado',
};

function formatDayLabel(ymd: string) {
  const [, m, d] = ymd.split('-');
  return `${d}/${m}`;
}

export function DashboardClient() {
  const [preset, setPreset] = useState<DashboardPreset>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const queryKey = useMemo(
    () =>
      preset === 'custom'
        ? (['admin-dashboard', preset, customFrom, customTo] as const)
        : (['admin-dashboard', preset] as const),
    [preset, customFrom, customTo],
  );

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: () => {
      if (preset === 'custom') {
        if (!customFrom || !customTo) {
          return Promise.reject(new Error('Informe as datas'));
        }
        if (customFrom > customTo) {
          return Promise.reject(new Error('Data inicial maior que a final'));
        }
        return dashboardApi.getSummary('custom', { from: customFrom, to: customTo });
      }
      return dashboardApi.getSummary(preset);
    },
    enabled: preset !== 'custom' || (Boolean(customFrom) && Boolean(customTo)),
  });

  const onApplyCustom = () => {
    if (!customFrom || !customTo) {
      toast.error('Selecione data inicial e final');
      return;
    }
    if (customFrom > customTo) {
      toast.error('A data inicial não pode ser maior que a final');
      return;
    }
    void refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['today', 'Hoje'],
              ['7d', '7 dias'],
              ['30d', '30 dias'],
              ['custom', 'Personalizado'],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              type="button"
              variant={preset === key ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => setPreset(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">De</label>
              <input
                type="date"
                className="h-9 rounded-md border border-flor-200 bg-white px-2 text-sm"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Até</label>
              <input
                type="date"
                className="h-9 rounded-md border border-flor-200 bg-white px-2 text-sm"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
            <Button type="button" size="sm" onClick={onApplyCustom}>
              Aplicar
            </Button>
          </div>
        )}
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error instanceof Error ? error.message : 'Não foi possível carregar o dashboard.'}
        </div>
      )}

      {isLoading && (
        <div className="rounded-xl border border-flor-100 py-16 text-center text-flor-400 text-sm">
          Carregando métricas…
        </div>
      )}

      {data && !isLoading && (
        <>
          <DashboardAlerts summary={data} />

          <div className="grid gap-4 sm:grid-cols-3" data-testid="dashboard-kpis">
            <KpiCard title="Receita" value={brl.format(data.kpis.revenue)} />
            <KpiCard title="Pedidos (pagos / faturados)" value={String(data.kpis.ordersCount)} />
            <KpiCard title="Ticket médio" value={brl.format(data.kpis.averageTicket)} />
          </div>

          <div className="rounded-xl border border-flor-100 bg-white p-4 shadow-sm">
            <h2 className="font-serif text-lg text-flor-900 mb-4">Receita por dia</h2>
            <div className="h-[min(320px,50vh)] w-full min-h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.revenueByDay}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="fillRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(28 35% 42%)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(28 35% 42%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-flor-100" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'hsl(28 12% 45%)' }}
                    tickFormatter={formatDayLabel}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(28 12% 45%)' }}
                    tickFormatter={(v) => brlCompact.format(Number(v))}
                    width={56}
                  />
                  <Tooltip
                    formatter={(value) => [
                      brl.format(typeof value === 'number' ? value : Number(value)),
                      'Receita',
                    ]}
                    labelFormatter={(l) =>
                      typeof l === 'string' ? l.split('-').reverse().join('/') : String(l)
                    }
                    contentStyle={{ borderRadius: 8, borderColor: 'hsl(35 25% 88%)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(28 35% 42%)"
                    fill="url(#fillRev)"
                    strokeWidth={2}
                    isAnimationActive={data.revenueByDay.length < 120}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-flor-100 bg-white p-4 shadow-sm">
              <h2 className="font-serif text-lg text-flor-900 mb-3">Top 5 produtos</h2>
              {data.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma venda no período.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-flor-100 text-left text-flor-500">
                        <th className="pb-2 pr-2">Produto</th>
                        <th className="pb-2 pr-2 text-right">Qtd</th>
                        <th className="pb-2 text-right">Receita</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topProducts.map((p) => (
                        <tr key={p.productId} className="border-b border-flor-50 last:border-0">
                          <td className="py-2 pr-2 font-medium text-flor-900">{p.name}</td>
                          <td className="py-2 pr-2 text-right tabular-nums">{p.unitsSold}</td>
                          <td className="py-2 text-right tabular-nums">{brl.format(p.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-flor-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-serif text-lg text-flor-900">Pedidos recentes</h2>
                <Link
                  href="/admin/pedidos"
                  className="text-xs font-medium text-flor-700 hover:underline inline-flex items-center gap-0.5"
                >
                  Ver todos
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>
              {data.recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum pedido ainda.</p>
              ) : (
                <ul className="divide-y divide-flor-50">
                  {data.recentOrders.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/admin/pedidos/${o.id}`}
                        className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm hover:bg-flor-50/60 -mx-2 px-2 rounded-lg transition-colors"
                      >
                        <div>
                          <p className="font-medium text-flor-900">{o.number}</p>
                          <p className="text-xs text-muted-foreground">
                            {orderStatusLabel[o.status] ?? o.status}
                            {o.customerName ? ` · ${o.customerName}` : ''}
                          </p>
                        </div>
                        <span className="tabular-nums font-medium text-flor-800">
                          {brl.format(o.total)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-serif text-lg text-flor-900 mb-3">Atalhos</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <ShortcutCard
                href="/admin/produtos/novo"
                icon={Package}
                title="Novo produto"
                description="Cadastrar peça no catálogo"
              />
              <ShortcutCard
                href="/admin/pedidos"
                icon={ShoppingBag}
                title="Ver pedidos"
                description="Lista e detalhes"
              />
              <ShortcutCard
                href="/admin/configuracoes/frete"
                icon={Truck}
                title="Configurar frete"
                description="Melhor Envio e regras"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-flor-100 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-flor-500">{title}</p>
      <p className="mt-2 font-serif text-2xl text-flor-900 tabular-nums">{value}</p>
    </div>
  );
}

function ShortcutCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex gap-3 rounded-xl border border-flor-100 bg-white p-4 shadow-sm transition-colors hover:border-flor-200 hover:bg-flor-50/40"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-flor-100 text-flor-800">
        <Icon className="size-5" />
      </div>
      <div>
        <p className="font-medium text-flor-900">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </Link>
  );
}

function DashboardAlerts({ summary }: { summary: DashboardSummary }) {
  const { alerts } = summary;
  return (
    <div className="space-y-2">
      {alerts.lowStockCount > 0 && (
        <AlertBanner
          icon={AlertTriangle}
          title="Estoque baixo"
          description={`${alerts.lowStockCount} produto(s) com estoque baixo.`}
          href="/admin/estoque?status=low"
          actionLabel="Ver estoque"
        />
      )}
      {alerts.pendingReviewsCount > 0 && (
        <AlertBanner
          icon={Star}
          title="Reviews pendentes"
          description={`${alerts.pendingReviewsCount} avaliação(ões) aguardando moderação.`}
          href="/admin/reviews"
          actionLabel="Moderar"
        />
      )}
      {alerts.unattendedOrdersCount > 0 && (
        <AlertBanner
          icon={ShoppingBag}
          title="Pedidos a tratar"
          description={`${alerts.unattendedOrdersCount} pedido(s) pago(s) ou em separação.`}
          href="/admin/pedidos?status=PAID"
          actionLabel="Ver pedidos"
        />
      )}
    </div>
  );
}

function AlertBanner({
  title,
  description,
  href,
  actionLabel,
  icon: Icon,
}: {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <Icon className="size-5 shrink-0 text-amber-800 mt-0.5" />
        <div>
          <p className="font-medium text-amber-950">{title}</p>
          <p className="text-sm text-amber-900/80">{description}</p>
        </div>
      </div>
      <Link
        href={href}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'shrink-0 border-amber-300 bg-white',
        )}
      >
        {actionLabel}
      </Link>
    </div>
  );
}
