import { readErrorFromResponse } from '@/lib/errors';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333';

function hdrs(token: string, withJson = false): HeadersInit {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (withJson) headers['Content-Type'] = 'application/json';
  return headers;
}

export interface AdminOrderListItem {
  id: string;
  number: string;
  status: string;
  total: number;
  createdAt: string;
  customerName: string | null;
  customerEmail: string | null;
}

export interface AdminOrderListPage {
  items: AdminOrderListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminOrderDetail {
  id: string;
  number: string;
  status: string;
  cpf: string | null;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  shippingAddress: unknown;
  couponCode: string | null;
  notes: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  trackingCode: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string; phone: string | null };
  items: Array<{
    id: string;
    productId: string;
    variantId: string;
    productName: string;
    variantSize: string | null;
    variantColor: string | null;
    productImageUrl: string | null;
    unitPrice: number;
    quantity: number;
    subtotal: number;
  }>;
  payment: {
    id: string;
    method: string;
    status: string;
    amount: number;
    installments: number;
    paidAt: string | null;
    failureReason: string | null;
    pixCopyPaste: string | null;
    pixExpiresAt: string | null;
  } | null;
  shipping: {
    id: string;
    serviceName: string;
    trackingCode: string | null;
    estimatedDays: number | null;
    cost: number;
    shippedAt: string | null;
    deliveredAt: string | null;
  } | null;
  statusHistory?: Array<{
    id: string;
    fromStatus: string;
    toStatus: string;
    notes: string | null;
    changedByUserId: string | null;
    at: string;
  }>;
}

export type AdminOrderValidTransitions = {
  current: string;
  validNext: string[];
};

export type AdminOrderStatusUpdateBody = {
  status: string;
  trackingCode?: string;
  notifyCustomer?: boolean;
  notes?: string;
};

export type AdminOrderStatusUpdateResponse = {
  id: string;
  number: string;
  status: string;
  trackingCode: string | null;
  trackingUrl: string | null;
  updatedAt: string;
  notifiedCustomer: boolean;
  history: Array<{
    fromStatus: string;
    toStatus: string;
    at: string;
    notes: string | null;
  }>;
};

export type AdminOrdersListParams = {
  page?: number;
  pageSize?: number;
  status?: string;
};

export async function fetchAdminOrdersList(
  token: string,
  params?: AdminOrdersListParams,
): Promise<AdminOrderListPage> {
  const qs = params
    ? '?' +
      new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v != null && v !== '')
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';
  const res = await fetch(`${API}/admin/orders${qs}`, {
    headers: hdrs(token),
    cache: 'no-store',
  });
  if (!res.ok) await readErrorFromResponse(res);
  return res.json() as Promise<AdminOrderListPage>;
}

export async function fetchAdminOrderById(token: string, id: string): Promise<AdminOrderDetail> {
  const res = await fetch(`${API}/admin/orders/${id}`, {
    headers: hdrs(token),
    cache: 'no-store',
  });
  if (!res.ok) await readErrorFromResponse(res);
  return res.json() as Promise<AdminOrderDetail>;
}

export async function fetchAdminOrderValidTransitions(
  token: string,
  id: string,
): Promise<AdminOrderValidTransitions> {
  const res = await fetch(`${API}/admin/orders/${id}/valid-transitions`, {
    headers: hdrs(token),
    cache: 'no-store',
  });
  if (!res.ok) await readErrorFromResponse(res);
  return res.json() as Promise<AdminOrderValidTransitions>;
}

export async function patchAdminOrderStatus(
  token: string,
  id: string,
  body: AdminOrderStatusUpdateBody,
): Promise<AdminOrderStatusUpdateResponse> {
  const res = await fetch(`${API}/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: hdrs(token, true),
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!res.ok) await readErrorFromResponse(res);
  return res.json() as Promise<AdminOrderStatusUpdateResponse>;
}
