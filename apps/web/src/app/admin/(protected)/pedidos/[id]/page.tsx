import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/admin/require-admin';
import { AdminPedidoDetailClient } from './admin-pedido-detail-client';

export default async function AdminPedidoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireAdmin();
  if (!user) redirect('/admin/login');

  const token = (await cookies()).get('access_token')?.value ?? '';
  if (!token) redirect('/admin/login');

  const { id } = await params;
  return <AdminPedidoDetailClient orderId={id} accessToken={token} />;
}
