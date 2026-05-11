'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CouponForm, type CouponFormData } from '@/components/admin/coupons/coupon-form';
import { updateCoupon } from '@/lib/admin/coupons-api';
import type { CouponWithStatus } from '@/lib/admin/coupons-api';

interface CategoryOption {
  id: string;
  name: string;
}

interface Props {
  id: string;
  initial: CouponWithStatus;
  categories: CategoryOption[];
}

export function EditCouponFormWrapper({ id, initial, categories }: Props) {
  const router = useRouter();

  async function handleSubmit(data: CouponFormData) {
    await updateCoupon(id, data);
    toast.success('Cupom atualizado com sucesso!');
    router.push(`/admin/cupons/${id}`);
    router.refresh();
  }

  return (
    <CouponForm mode="edit" initial={initial} categories={categories} onSubmit={handleSubmit} />
  );
}
