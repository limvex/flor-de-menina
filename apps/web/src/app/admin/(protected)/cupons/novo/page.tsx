import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/admin/require-admin';
import { fetchCategories } from '@/lib/admin/categories-api';
import { fetchCoupon } from '@/lib/admin/coupons-api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { CouponFormWrapper } from './coupon-form-wrapper';

export default async function NovoCupomPage({
  searchParams,
}: {
  searchParams: Promise<{ duplicate?: string }>;
}) {
  const user = await requireAdmin();
  if (!user) redirect('/admin/login');

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';

  const { duplicate } = await searchParams;

  const [categories, duplicateSource] = await Promise.all([
    fetchCategories(token).catch(() => []),
    duplicate ? fetchCoupon(token, duplicate).catch(() => null) : Promise.resolve(null),
  ]);

  const initial = duplicateSource ? { ...duplicateSource, code: '', id: undefined } : undefined;

  return (
    <>
      <AdminPageHeader
        title={duplicateSource ? `Duplicar: ${duplicateSource.code}` : 'Novo cupom'}
        description="Preencha os dados para criar um novo cupom"
        backHref="/admin/cupons"
      />
      <CouponFormWrapper
        mode="create"
        initial={initial}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </>
  );
}
