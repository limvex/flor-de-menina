import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/admin/require-admin';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { BannerSectionForm } from '@/components/admin/home-content/banner-section-form';
import { AboutSectionForm } from '@/components/admin/home-content/about-section-form';
import { ContactSectionForm } from '@/components/admin/home-content/contact-section-form';
import { fetchAdminHomeContent } from '@/lib/api/home-content';

export const metadata = { title: 'Aparência da loja | Admin' };

export default async function AparenciaPage() {
  const user = await requireAdmin();
  if (!user) redirect('/admin/login');

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';

  const content = await fetchAdminHomeContent(token).catch(() => ({
    bannerImageUrl: null,
    bannerTitle: null,
    bannerSubtitle: null,
    bannerButtonText: null,
    bannerButtonUrl: null,
    aboutTitle: null,
    aboutText: null,
    whatsappNumber: null,
    instagramUrl: null,
    updatedAt: new Date().toISOString(),
  }));

  return (
    <>
      <AdminPageHeader
        title="Aparência da loja"
        description="Edite banner, textos e contato sem precisar do desenvolvedor."
        backHref="/admin/configuracoes"
      />
      <div className="space-y-6">
        <BannerSectionForm initialData={content} token={token} />
        <AboutSectionForm initialData={content} token={token} />
        <ContactSectionForm initialData={content} token={token} />
      </div>
    </>
  );
}
