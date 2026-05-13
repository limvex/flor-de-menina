import { api } from './client';

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

export const adminOrdersApi = {
  list: (params?: AdminOrdersListParams) => {
    const qs = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v != null && v !== '')
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : '';
    return api.get<AdminOrderListPage>(`/admin/orders${qs}`);
  },

  getById: (id: string) => api.get<AdminOrderDetail>(`/admin/orders/${id}`),

  getValidTransitions: (id: string) =>
    api.get<AdminOrderValidTransitions>(`/admin/orders/${id}/valid-transitions`),

  updateStatus: (id: string, body: AdminOrderStatusUpdateBody) =>
    api.patch<AdminOrderStatusUpdateResponse>(`/admin/orders/${id}/status`, body),
};
