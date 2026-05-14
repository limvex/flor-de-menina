import { api } from './client';
import type { AdminUserListItem } from '@flor/types';

export interface CreateAdminPayload {
  name: string;
  email: string;
  temporaryPassword: string;
}

export interface UpdateAdminPayload {
  name: string;
}

export const adminUsersApi = {
  list: () => api.get<AdminUserListItem[]>('/admin/users'),

  create: (payload: CreateAdminPayload) => api.post<AdminUserListItem>('/admin/users', payload),

  update: (id: string, payload: UpdateAdminPayload) =>
    api.patch<AdminUserListItem>(`/admin/users/${id}`, payload),

  remove: (id: string) => api.delete<{ ok: boolean }>(`/admin/users/${id}`),
};

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const authAdminApi = {
  changePassword: (payload: ChangePasswordPayload) =>
    api.post<{ ok: boolean }>('/auth/admin/change-password', payload),
};
