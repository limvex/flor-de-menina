import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { InstitutionalPageFormValues } from '@flor/types';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { PageFormWrapper } from '../page-form-wrapper';
import { requireAdmin } from '@/lib/admin/require-admin';
import { fetchAdminPage } from '@/lib/admin/pages-api';

function toFormValues(p: {
  slug: string;
  title: string;
  content: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImage: string | null;
  isActive: boolean;
  sortOrder: number;
}): InstitutionalPageFormValues {
  return {
    slug: p.slug,
    title: p.title,
    content: p.content,
    metaTitle: p.metaTitle ?? '',
    metaDescription: p.metaDescription ?? '',
    ogImage: p.ogImage ?? '',
    isActive: p.isActive,
    sortOrder: p.sortOrder,
  };
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarPaginaInstitucionalPage({ params }: Props) {
  const user = await requireAdmin();
  if (!user) redirect('/admin/login');

  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';

  let page;
  try {
    page = await fetchAdminPage(token, id);
  } catch {
    notFound();
  }

  return (
    <>
      <AdminPageHeader
        title="Editar página"
        description={page.title}
        backHref="/admin/paginas"
        actions={
          <Button variant="outline" render={<Link href="/admin/paginas" />} nativeButton={false}>
            Voltar à lista
          </Button>
        }
      />
      <PageFormWrapper mode="edit" pageId={page.id} initialValues={toFormValues(page)} />
    </>
  );
}
