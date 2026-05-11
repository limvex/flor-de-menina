import { redirect, notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/admin/require-admin';
import { fetchCoupon } from '@/lib/admin/coupons-api';
import { fetchCategories } from '@/lib/admin/categories-api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { EditCouponFormWrapper } from './edit-coupon-form-wrapper';

export default async function EditarCupomPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) redirect('/admin/login');

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';

  const { id } = await params;

  let coupon, categories;
  try {
    [coupon, categories] = await Promise.all([
      fetchCoupon(token, id),
      fetchCategories(token).catch(() => []),
    ]);
  } catch {
    notFound();
  }

  return (
    <>
      <AdminPageHeader
        title={`Editar: ${coupon.code}`}
        description="Altere as configurações do cupom"
        backHref={`/admin/cupons/${id}`}
      />
      <EditCouponFormWrapper
        id={id}
        initial={coupon}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </>
  );
}
