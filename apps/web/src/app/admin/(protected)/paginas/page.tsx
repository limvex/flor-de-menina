import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { cookies } from 'next/headers';
import type { InstitutionalPageAdmin } from '@flor/types';
import { requireAdmin } from '@/lib/admin/require-admin';
import { fetchAdminPages } from '@/lib/admin/pages-api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { PagesListClient } from './pages-list-client';

export default async function AdminPaginasPage() {
  const user = await requireAdmin();
  if (!user) redirect('/admin/login');

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';

  let pages: InstitutionalPageAdmin[];
  try {
    pages = await fetchAdminPages(token || null, { sort: 'sortOrder:asc' });
  } catch {
    pages = [];
  }

  return (
    <>
      <AdminPageHeader
        title="Páginas institucionais"
        description="Gerencie o conteúdo editável da loja"
        actions={
          <Button render={<Link href="/admin/paginas/nova" />} nativeButton={false}>
            <Plus className="size-4" />
            Nova página
          </Button>
        }
      />
      <PagesListClient initialPages={pages} />
    </>
  );
}
