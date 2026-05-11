import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/admin/require-admin';
import { fetchCoupons } from '@/lib/admin/coupons-api';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { Button } from '@/components/ui/button';
import { CouponListClient } from './coupon-list-client';

export default async function CuponsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}) {
  const user = await requireAdmin();
  if (!user) redirect('/admin/login');

  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value ?? '';

  const params = await searchParams;
  const queryParams: Record<string, string> = {};
  if (params.status) queryParams['status'] = params.status;
  if (params.search) queryParams['search'] = params.search;
  if (params.page) queryParams['page'] = params.page;

  let result;
  try {
    result = await fetchCoupons(token, queryParams);
  } catch {
    result = { data: [], total: 0, page: 1, limit: 20, pages: 0 };
  }

  return (
    <>
      <AdminPageHeader
        title="Cupons"
        description="Crie e gerencie campanhas de desconto"
        actions={
          <Button render={<Link href="/admin/cupons/novo" />} nativeButton={false}>
            <Plus className="size-4" />
            Novo cupom
          </Button>
        }
      />
      <CouponListClient
        initialData={result}
        initialFilters={{
          status: params.status ?? 'all',
          search: params.search ?? '',
        }}
      />
    </>
  );
}
