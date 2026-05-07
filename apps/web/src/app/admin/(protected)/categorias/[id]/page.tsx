import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/admin/require-admin';
import { fetchCategories, fetchCategory } from '@/lib/admin/categories-api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { CategoryForm } from '@/components/admin/categories/category-form';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarCategoriaPage({ params }: PageProps) {
  const user = await requireAdmin();
  if (!user) redirect('/admin/login');

  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';

  let category;
  try {
    category = await fetchCategory(token, id);
  } catch {
    notFound();
  }

  const allCategories = await fetchCategories(token);
  // Root categories excluding the category itself (can't be its own parent)
  const rootCategories = allCategories.filter((c) => c.parentId === null && c.id !== id);

  return (
    <>
      <AdminPageHeader
        title={`Editar: ${category.name}`}
        description="Atualize os dados da categoria."
      />
      <CategoryForm mode="edit" initialData={category} parentCategories={rootCategories} />
    </>
  );
}
