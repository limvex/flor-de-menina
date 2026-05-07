import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/admin/require-admin';
import { fetchCategories } from '@/lib/admin/categories-api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { CategoryForm } from '@/components/admin/categories/category-form';

export default async function NovaCategoriaPage() {
  const user = await requireAdmin();
  if (!user) redirect('/admin/login');

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';

  // Fetch only root categories (parentId = null) to populate the parent select
  const allCategories = await fetchCategories(token);
  const rootCategories = allCategories.filter((c) => c.parentId === null);

  return (
    <>
      <AdminPageHeader
        title="Nova categoria"
        description="Crie uma nova categoria para organizar seus produtos."
      />
      <CategoryForm mode="create" parentCategories={rootCategories} />
    </>
  );
}
