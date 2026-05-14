import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/require-admin';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminUsersClient } from './admin-users-client';

export const metadata = { title: 'Usuários administradores | Admin' };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

export default async function UsuariosPage() {
  const user = await requireAdmin();
  if (!user) redirect('/admin/login');

  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';

  let initialAdmins = [];
  try {
    const res = await fetch(`${API_URL}/admin/users`, {
      headers: { Cookie: `access_token=${token}` },
      cache: 'no-store',
    });
    if (res.ok) initialAdmins = await res.json();
  } catch {}

  return (
    <>
      <AdminPageHeader
        title="Administradores"
        description="Gerencie quem tem acesso ao painel administrativo."
        backHref="/admin/configuracoes"
      />
      <AdminUsersClient initialAdmins={initialAdmins} currentUserId={user.id} />
    </>
  );
}
