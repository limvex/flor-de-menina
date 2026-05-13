import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/admin/require-admin';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminOrdersListClient } from './admin-orders-list-client';

export default async function AdminPedidosPage() {
  const user = await requireAdmin();
  if (!user) redirect('/admin/login');

  const token = (await cookies()).get('access_token')?.value ?? '';
  if (!token) redirect('/admin/login');

  return (
    <div className="space-y-4">
      <AdminPageHeader title="Pedidos" description="Acompanhe todos os pedidos da loja." />
      <Suspense
        fallback={
          <div className="rounded-xl border border-flor-100 py-12 text-center text-sm text-flor-400">
            Carregando…
          </div>
        }
      >
        <AdminOrdersListClient accessToken={token} />
      </Suspense>
    </div>
  );
}
