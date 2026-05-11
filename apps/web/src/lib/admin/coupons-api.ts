import type {
  CouponSummary,
  CouponStats,
  CouponUsageSummary,
  CreateCouponInput,
  UpdateCouponInput,
} from '@flor/types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

function hdrs(token: string): HeadersInit {
  return { 'Content-Type': 'application/json', Cookie: `access_token=${token}` };
}

function clientHdrs(): HeadersInit {
  return { 'Content-Type': 'application/json' };
}

export interface CouponListResponse {
  data: CouponWithStatus[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CouponWithStatus extends CouponSummary {
  status: 'active' | 'expired' | 'exhausted' | 'inactive' | 'scheduled';
}

export interface CouponDetail extends CouponWithStatus {
  stats?: CouponStats;
}

export interface CouponUsageListResponse {
  data: CouponUsageSummary[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export async function fetchCoupons(
  token: string | null,
  params?: Record<string, string>,
): Promise<CouponListResponse> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${API}/admin/coupons${qs}`, {
    headers: token ? hdrs(token) : clientHdrs(),
    credentials: token ? undefined : 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Erro ao buscar cupons');
  return res.json();
}

export async function fetchCoupon(token: string, id: string): Promise<CouponDetail> {
  const res = await fetch(`${API}/admin/coupons/${id}`, {
    headers: hdrs(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Cupom não encontrado');
  return res.json();
}

export async function fetchCouponUsages(
  token: string,
  id: string,
  params?: Record<string, string>,
): Promise<CouponUsageListResponse> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch(`${API}/admin/coupons/${id}/usages${qs}`, {
    headers: hdrs(token),
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Erro ao buscar usos');
  return res.json();
}

export async function createCoupon(data: CreateCouponInput): Promise<CouponDetail> {
  const res = await fetch(`${API}/admin/coupons`, {
    method: 'POST',
    headers: clientHdrs(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Erro ao criar cupom');
  }
  return res.json();
}

export async function updateCoupon(id: string, data: UpdateCouponInput): Promise<CouponDetail> {
  const res = await fetch(`${API}/admin/coupons/${id}`, {
    method: 'PATCH',
    headers: clientHdrs(),
    credentials: 'include',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Erro ao atualizar cupom');
  }
  return res.json();
}

export async function deleteCoupon(id: string): Promise<void> {
  const res = await fetch(`${API}/admin/coupons/${id}`, {
    method: 'DELETE',
    headers: clientHdrs(),
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Erro ao excluir cupom');
}
