import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/admin/require-admin';
import { fetchCoupon, fetchCouponUsages } from '@/lib/admin/coupons-api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { CouponStatusBadge } from '@/components/admin/coupons/coupon-status-badge';
import { CouponTypeBadge } from '@/components/admin/coupons/coupon-type-badge';
import { formatPrice } from '@/lib/format';
import { Pencil, Layers } from 'lucide-react';

export default async function CouponDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) redirect('/admin/login');

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';

  const { id } = await params;

  let coupon, usagesResult;
  try {
    [coupon, usagesResult] = await Promise.all([
      fetchCoupon(token, id),
      fetchCouponUsages(token, id, { limit: '10' }),
    ]);
  } catch {
    notFound();
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const formatValue = () => {
    if (coupon.type === 'FREE_SHIPPING') return 'Frete grátis';
    if (coupon.type === 'PERCENTAGE') return `${coupon.value}%`;
    return formatPrice(coupon.value);
  };

  return (
    <>
      <AdminPageHeader
        title={coupon.code}
        description={coupon.description ?? 'Sem descrição'}
        backHref="/admin/cupons"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              render={<Link href={`/admin/cupons/novo?duplicate=${id}`} />}
              nativeButton={false}
            >
              <Layers className="size-4" />
              Duplicar
            </Button>
            <Button render={<Link href={`/admin/cupons/${id}/editar`} />} nativeButton={false}>
              <Pencil className="size-4" />
              Editar
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Resumo */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-stone-700 mb-4">Configurações</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="text-stone-400">Tipo</dt>
                <dd className="mt-0.5">
                  <CouponTypeBadge type={coupon.type} value={coupon.value} />
                </dd>
              </div>
              <div>
                <dt className="text-stone-400">Valor</dt>
                <dd className="font-semibold text-stone-800 mt-0.5">{formatValue()}</dd>
              </div>
              <div>
                <dt className="text-stone-400">Status</dt>
                <dd className="mt-0.5">
                  <CouponStatusBadge status={coupon.status} />
                </dd>
              </div>
              <div>
                <dt className="text-stone-400">Válido de</dt>
                <dd className="text-stone-700 mt-0.5">
                  {formatDate(coupon.validFrom)} até {formatDate(coupon.validUntil)}
                </dd>
              </div>
              {coupon.minCartValue && (
                <div>
                  <dt className="text-stone-400">Valor mínimo</dt>
                  <dd className="text-stone-700 mt-0.5">{formatPrice(coupon.minCartValue)}</dd>
                </div>
              )}
              {coupon.maxDiscountAmount && (
                <div>
                  <dt className="text-stone-400">Teto de desconto</dt>
                  <dd className="text-stone-700 mt-0.5">{formatPrice(coupon.maxDiscountAmount)}</dd>
                </div>
              )}
              <div>
                <dt className="text-stone-400">Só primeira compra</dt>
                <dd className="text-stone-700 mt-0.5">{coupon.firstOrderOnly ? 'Sim' : 'Não'}</dd>
              </div>
              <div>
                <dt className="text-stone-400">Usos por cliente</dt>
                <dd className="text-stone-700 mt-0.5">{coupon.maxUsesPerCustomer}×</dd>
              </div>
            </dl>
          </div>

          {/* Tabela de usos */}
          <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100">
              <h2 className="text-sm font-semibold text-stone-700">Histórico de uso</h2>
            </div>
            {usagesResult.data.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-400">Nenhum uso registrado</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-stone-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-stone-600">Data</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-600">Cliente</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-600">Pedido</th>
                    <th className="px-4 py-3 text-left font-medium text-stone-600">Desconto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {usagesResult.data.map((u) => (
                    <tr key={u.id} className="hover:bg-stone-50">
                      <td className="px-4 py-3 text-stone-500 text-xs">
                        {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-stone-800">{u.customerName}</div>
                        <div className="text-xs text-stone-400">{u.customerEmail}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-stone-600 text-xs">
                        {u.orderNumber}
                      </td>
                      <td className="px-4 py-3 font-medium text-green-700">
                        −{formatPrice(u.discountAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Estatísticas */}
        <div className="space-y-4">
          {[
            {
              label: 'Total de usos',
              value: `${coupon.totalUses}${coupon.maxTotalUses ? ` / ${coupon.maxTotalUses}` : ' / ∞'}`,
            },
            { label: 'Receita total gerada', value: formatPrice(coupon.totalRevenue) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg border border-stone-200 bg-white p-4 text-center"
            >
              <p className="text-xs text-stone-400">{stat.label}</p>
              <p className="text-2xl font-bold text-stone-900 mt-1">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
