import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/require-admin';
import { fetchVariantStock, fetchVariantMovements } from '@/lib/admin/stock-api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { MovementHistoryTable } from '@/components/admin/stock/movement-history-table';
import { StockBadge } from '@/components/admin/stock/stock-badge';

interface PageProps {
  params: Promise<{ variantId: string }>;
  searchParams: Promise<Record<string, string>>;
}

export default async function VariantHistoryPage({ params, searchParams }: PageProps) {
  const user = await requireAdmin();
  if (!user) redirect('/admin/login');

  const { variantId } = await params;
  const sp = await searchParams;

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';

  const [variant, history] = await Promise.all([
    fetchVariantStock(token, variantId),
    fetchVariantMovements(token, variantId, {
      type: sp.type,
      source: sp.source,
      from: sp.from,
      to: sp.to,
      page: sp.page ? Number(sp.page) : undefined,
      pageSize: 30,
    }),
  ]);

  const variantLabel = [variant.size, variant.color].filter(Boolean).join(' / ') || variant.sku;

  const totalIn = history.items
    .filter((m) => m.type === 'IN')
    .reduce((s: number, m) => s + m.quantity, 0);
  const totalOut = history.items
    .filter((m) => m.type === 'OUT')
    .reduce((s: number, m) => s + m.quantity, 0);
  const lastMovement = history.items[0];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Histórico — ${variant.productName} · ${variantLabel}`}
        description="Todas as movimentações de estoque desta variante."
        backHref="/admin/estoque"
      />

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-flor-100 rounded-xl p-4">
          <p className="text-sm text-flor-400 mb-1">Estoque atual</p>
          <p className="text-3xl font-semibold text-flor-800">{variant.stock}</p>
          <StockBadge stock={variant.stock} className="mt-2" />
        </div>
        <div className="bg-white border border-flor-100 rounded-xl p-4">
          <p className="text-sm text-flor-400 mb-1">Total entradas</p>
          <p className="text-2xl font-semibold text-green-700">+{totalIn}</p>
        </div>
        <div className="bg-white border border-flor-100 rounded-xl p-4">
          <p className="text-sm text-flor-400 mb-1">Total saídas</p>
          <p className="text-2xl font-semibold text-red-600">-{totalOut}</p>
        </div>
        <div className="bg-white border border-flor-100 rounded-xl p-4">
          <p className="text-sm text-flor-400 mb-1">Última movimentação</p>
          <p className="text-sm font-medium text-flor-700">
            {lastMovement
              ? new Date(lastMovement.createdAt).toLocaleString('pt-BR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })
              : '—'}
          </p>
        </div>
      </div>

      <MovementHistoryTable items={history.items} />

      {/* Paginação simples */}
      {history.total > 30 && (
        <p className="text-sm text-center text-flor-400">
          Exibindo {Math.min(30, history.items.length)} de {history.total} movimentações
        </p>
      )}
    </div>
  );
}
