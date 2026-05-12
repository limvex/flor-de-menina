import { Suspense } from 'react';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminOrdersListClient } from './admin-orders-list-client';

export default function AdminPedidosPage() {
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
        <AdminOrdersListClient />
      </Suspense>
    </div>
  );
}
