'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CouponForm, type CouponFormData } from '@/components/admin/coupons/coupon-form';
import { createCoupon } from '@/lib/admin/coupons-api';
import type { CouponWithStatus } from '@/lib/admin/coupons-api';

interface CategoryOption {
  id: string;
  name: string;
}

interface Props {
  mode: 'create' | 'edit';
  initial?: Partial<CouponWithStatus>;
  categories: CategoryOption[];
}

export function CouponFormWrapper({ mode, initial, categories }: Props) {
  const router = useRouter();

  async function handleSubmit(data: CouponFormData) {
    await createCoupon(data);
    toast.success('Cupom criado com sucesso!');
    router.push('/admin/cupons');
    router.refresh();
  }

  return (
    <CouponForm mode={mode} initial={initial} categories={categories} onSubmit={handleSubmit} />
  );
}
