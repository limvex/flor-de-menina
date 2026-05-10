import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/admin/require-admin';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { FreteConfigClient } from '@/components/admin/shipping/frete-config-client';
import { fetchShippingSettings, getMeStatus } from '@/lib/api/admin/shipping';

export const metadata = { title: 'Configurações de Frete | Admin' };

export default async function FretePage() {
  const user = await requireAdmin();
  if (!user) redirect('/admin/login');

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';

  const [settings, meStatus] = await Promise.allSettled([
    fetchShippingSettings(token),
    getMeStatus(token),
  ]);

  if (settings.status === 'rejected') {
    throw new Error('Erro ao carregar as configurações de frete.');
  }

  return (
    <>
      <AdminPageHeader
        title="Configurações de Frete"
        description="Configure o provedor de frete, endereço de origem e regras de frete grátis."
      />
      <FreteConfigClient
        initialSettings={settings.value}
        meStatus={meStatus.status === 'fulfilled' ? meStatus.value : { connected: false }}
        token={token}
      />
    </>
  );
}
