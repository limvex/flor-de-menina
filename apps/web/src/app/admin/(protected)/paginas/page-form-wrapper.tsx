'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PageForm } from '@/components/admin/pages/page-form';
import type { InstitutionalPageFormValues } from '@flor/types';
import { createAdminPage, updateAdminPage, type SavePagePayload } from '@/lib/admin/pages-api';

function toPayload(data: InstitutionalPageFormValues): SavePagePayload {
  return {
    slug: data.slug.trim(),
    title: data.title.trim(),
    content: data.content,
    metaTitle: data.metaTitle?.trim() ? data.metaTitle.trim() : null,
    metaDescription: data.metaDescription?.trim() ? data.metaDescription.trim() : null,
    ogImage: data.ogImage?.trim() ? data.ogImage.trim() : null,
    isActive: data.isActive,
    sortOrder: data.sortOrder,
  };
}

type Props =
  | { mode: 'create' }
  | { mode: 'edit'; pageId: string; initialValues: InstitutionalPageFormValues };

export function PageFormWrapper(props: Props) {
  const router = useRouter();

  async function handleSubmit(data: InstitutionalPageFormValues) {
    const payload = toPayload(data);
    if (props.mode === 'create') {
      await createAdminPage(payload);
      toast.success('Página criada!');
    } else {
      await updateAdminPage(props.pageId, payload);
      toast.success('Página atualizada!');
    }
    router.push('/admin/paginas');
    router.refresh();
  }

  if (props.mode === 'create') {
    return <PageForm mode="create" onSubmit={handleSubmit} onCancelHref="/admin/paginas" />;
  }

  return (
    <PageForm
      mode="edit"
      defaultValues={props.initialValues}
      onSubmit={handleSubmit}
      onCancelHref="/admin/paginas"
    />
  );
}
