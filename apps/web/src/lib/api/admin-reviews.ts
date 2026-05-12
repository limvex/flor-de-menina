import { api } from './client';

export interface AdminReviewListItem {
  id: string;
  status: string;
  rating: number;
  title: string | null;
  comment: string;
  photos: string[];
  createdAt: string;
  product: { id: string; name: string; slug: string };
  user: { id: string; name: string; email: string };
}

export interface AdminReviewListPage {
  items: AdminReviewListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export type AdminReviewsListParams = {
  status?: string;
  page?: number;
  pageSize?: number;
};

export const adminReviewsApi = {
  list: (params?: AdminReviewsListParams) => {
    const qs = params
      ? '?' +
        new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v != null && v !== '')
            .map(([k, v]) => [k, String(v)]),
        ).toString()
      : '';
    return api.get<AdminReviewListPage>(`/admin/reviews${qs}`);
  },

  moderate: (id: string, body: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) =>
    api.patch<AdminReviewListItem>(`/admin/reviews/${id}`, body),
};
