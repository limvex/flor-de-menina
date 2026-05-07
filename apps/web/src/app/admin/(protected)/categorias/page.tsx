import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/admin/require-admin';
import { fetchCategories } from '@/lib/admin/categories-api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { CategoryListTable } from '@/components/admin/categories/category-list-table';
import { Button } from '@/components/ui/button';

export default async function CategoriasPage() {
  const user = await requireAdmin();
  if (!user) redirect('/admin/login');

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';

  const categories = await fetchCategories(token);

  return (
    <>
      <AdminPageHeader
        title="Categorias"
        description="Gerencie as categorias e tabelas de medidas da loja."
        actions={
          <Button render={<Link href="/admin/categorias/nova" />} nativeButton={false}>
            <Plus className="size-4" />
            Nova categoria
          </Button>
        }
      />
      <CategoryListTable data={categories} />
    </>
  );
}
