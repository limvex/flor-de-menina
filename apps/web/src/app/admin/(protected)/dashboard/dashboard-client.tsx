'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Package, ShoppingBag, Truck, AlertTriangle, ChevronRight } from 'lucide-react';
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
import { ApiError } from '@/lib/errors';
import { dashboardApi, type DashboardPreset, type DashboardSummary } from '@/lib/api/dashboard';
import { getStatusLabel } from '@/lib/orders/status-labels';

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

function formatDayLabel(ymd: string) {
  const [, m, d] = ymd.split('-');
  return `${d}/${m}`;
}

function messageFromDashboardError(err: unknown): string {
  if (ApiError.isApiError(err)) return err.message;
  if (err instanceof Error && err.message.trim()) return err.message;
  return 'Não foi possível carregar o dashboard.';
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

  const { data, isLoading, isError, isFetching, error, refetch } = useQuery({
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

  const chartFont = 'var(--font-inter, ui-sans-serif, system-ui, sans-serif)' as const;

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
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
              className="shrink-0 touch-manipulation rounded-full"
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
        <div
          role="alert"
          className="rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-4 text-sm text-destructive"
        >
          <p className="font-medium text-destructive">Erro ao carregar o dashboard</p>
          <p className="mt-1 text-destructive/95">{messageFromDashboardError(error)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="touch-manipulation border-destructive/40 bg-white text-destructive hover:bg-destructive/5"
              disabled={isFetching}
              onClick={() => void refetch()}
            >
              {isFetching ? 'Tentando…' : 'Tentar novamente'}
            </Button>
            {ApiError.isApiError(error) && error.status === 401 ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                nativeButton={false}
                render={<Link href="/admin/login" />}
              >
                Ir para login
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {isLoading && !isError && (
        <div className="rounded-xl border border-flor-100 py-16 text-center text-flor-400 text-sm">
          Carregando métricas…
        </div>
      )}

      {data && !isLoading && !isError && (
        <>
          <DashboardAlerts summary={data} />

          <div
            className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"
            data-testid="dashboard-kpis"
          >
            <KpiCard title="Receita" value={brl.format(data.kpis.revenue)} />
            <KpiCard title="Pedidos (pagos / faturados)" value={String(data.kpis.ordersCount)} />
            <KpiCard title="Ticket médio" value={brl.format(data.kpis.averageTicket)} />
          </div>

          <div className="rounded-xl border border-flor-100 bg-white p-3 shadow-sm sm:p-4">
            <h2 className="mb-3 font-serif text-base text-flor-900 sm:mb-4 sm:text-lg">
              Receita por dia
            </h2>
            <div className="h-[min(280px,45svh)] w-full min-h-[220px] sm:h-[min(320px,50vh)] sm:min-h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data.revenueByDay}
                  margin={{ top: 8, right: 4, left: -4, bottom: 4 }}
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
                    tick={{
                      fontSize: 11,
                      fill: 'hsl(28 12% 45%)',
                      fontFamily: chartFont,
                    }}
                    tickFormatter={formatDayLabel}
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: 'hsl(28 12% 45%)',
                      fontFamily: chartFont,
                    }}
                    tickFormatter={(v) => brlCompact.format(Number(v))}
                    width={52}
                  />
                  <Tooltip
                    formatter={(value) => [
                      brl.format(typeof value === 'number' ? value : Number(value)),
                      'Receita',
                    ]}
                    labelFormatter={(l) =>
                      typeof l === 'string' ? l.split('-').reverse().join('/') : String(l)
                    }
                    contentStyle={{
                      borderRadius: 8,
                      borderColor: 'hsl(35 25% 88%)',
                      fontFamily: chartFont,
                    }}
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

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-flor-100 bg-white p-3 shadow-sm sm:p-4">
              <h2 className="mb-3 font-serif text-base text-flor-900 sm:text-lg">Top 5 produtos</h2>
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
                          <td className="py-2 pr-2 text-right font-sans text-sm font-semibold tabular-nums tracking-tight text-flor-800">
                            {p.unitsSold}
                          </td>
                          <td className="py-2 text-right font-sans text-sm font-semibold tabular-nums tracking-tight text-flor-800">
                            {brl.format(p.revenue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-flor-100 bg-white p-3 shadow-sm sm:p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-serif text-base text-flor-900 sm:text-lg">
                    Pedidos recentes
                  </h2>
                  <p className="mt-0.5 text-xs text-flor-500">Criados no período selecionado.</p>
                </div>
                <Link
                  href="/admin/pedidos"
                  className="text-xs font-medium text-flor-700 hover:underline inline-flex items-center gap-0.5"
                >
                  Ver todos
                  <ChevronRight className="size-3.5" />
                </Link>
              </div>
              {data.recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum pedido criado neste período.</p>
              ) : (
                <ul className="divide-y divide-flor-50">
                  {data.recentOrders.map((o) => (
                    <li key={o.id}>
                      <Link
                        href={`/admin/pedidos/${o.id}`}
                        className="flex min-h-12 items-center justify-between gap-3 rounded-lg py-2 text-sm transition-colors hover:bg-flor-50/60 -mx-2 px-2 touch-manipulation"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-snug text-flor-900">{o.number}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-flor-600">
                            {getStatusLabel(o.status)}
                            {o.customerName ? ` · ${o.customerName}` : ''}
                          </p>
                        </div>
                        <span className="shrink-0 text-right font-sans text-sm font-semibold tabular-nums tracking-tight text-flor-800">
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
            <h2 className="mb-3 font-serif text-base text-flor-900 sm:text-lg">Atalhos</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
      <p className="mt-2 font-sans text-xl font-semibold tabular-nums tracking-tight text-flor-900 sm:text-2xl">
        {value}
      </p>
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
      className="flex min-h-12 touch-manipulation items-center gap-3 rounded-xl border border-flor-100 bg-white p-4 shadow-sm transition-colors hover:border-flor-200 hover:bg-flor-50/40 sm:min-h-0"
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
      {alerts.unattendedOrdersCount > 0 && (
        <AlertBanner
          severity="critical"
          icon={ShoppingBag}
          title="Pedidos a tratar"
          description={`${alerts.unattendedOrdersCount} pedido(s) pago(s) ou em separação aguardando envio.`}
          href="/admin/pedidos"
          actionLabel="Ver pedidos"
        />
      )}
      {alerts.lowStockCount > 0 && (
        <AlertBanner
          severity="warning"
          icon={AlertTriangle}
          title="Estoque baixo"
          description={`${alerts.lowStockCount} produto(s) com estoque baixo.`}
          href="/admin/estoque?status=low"
          actionLabel="Ver estoque"
        />
      )}
    </div>
  );
}

function AlertBanner({
  severity,
  title,
  description,
  href,
  actionLabel,
  icon: Icon,
}: {
  severity: 'warning' | 'critical';
  title: string;
  description: string;
  href: string;
  actionLabel: string;
  icon: LucideIcon;
}) {
  const styles =
    severity === 'critical'
      ? {
          box: 'border-red-300/90 bg-red-50/95',
          icon: 'text-red-700',
          title: 'text-red-950',
          desc: 'text-red-900/85',
          btn: 'border-red-300 bg-white text-red-900 hover:bg-red-50',
        }
      : {
          box: 'border-amber-200/80 bg-amber-50/90',
          icon: 'text-amber-800',
          title: 'text-amber-950',
          desc: 'text-amber-900/80',
          btn: 'border-amber-300 bg-white text-amber-950 hover:bg-amber-50/80',
        };

  return (
    <div
      role={severity === 'critical' ? 'alert' : 'status'}
      className={cn(
        'flex min-h-12 flex-col gap-3 rounded-xl border px-4 py-3 touch-manipulation sm:min-h-0 sm:flex-row sm:items-center sm:justify-between',
        styles.box,
      )}
    >
      <div className="flex gap-3">
        <Icon className={cn('mt-0.5 size-5 shrink-0', styles.icon)} aria-hidden />
        <div>
          <p className={cn('font-medium', styles.title)}>{title}</p>
          <p className={cn('text-sm', styles.desc)}>{description}</p>
        </div>
      </div>
      <Link
        href={href}
        className={cn(
          buttonVariants({ variant: 'outline', size: 'sm' }),
          'min-h-10 shrink-0 touch-manipulation sm:min-h-8',
          styles.btn,
        )}
      >
        {actionLabel}
      </Link>
    </div>
  );
}
