import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { PageFormWrapper } from '../page-form-wrapper';
import { requireAdmin } from '@/lib/admin/require-admin';

export default async function NovaPaginaInstitucionalPage() {
  const user = await requireAdmin();
  if (!user) redirect('/admin/login');

  return (
    <>
      <AdminPageHeader
        title="Nova página"
        description="Crie uma nova página institucional"
        backHref="/admin/paginas"
        actions={
          <Button variant="outline" render={<Link href="/admin/paginas" />} nativeButton={false}>
            Voltar à lista
          </Button>
        }
      />
      <PageFormWrapper mode="create" />
    </>
  );
}
