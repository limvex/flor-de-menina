import { api } from './client';
import type {
  CustomerProfile,
  UpdateProfileInput,
  ChangePasswordInput,
  ChangeEmailInput,
  CustomerOrdersResponse,
  CustomerOrder,
} from '@flor/types';

export async function getCustomerProfile(): Promise<CustomerProfile> {
  return api.get<CustomerProfile>('/customer/profile');
}

export async function updateCustomerProfile(data: UpdateProfileInput): Promise<CustomerProfile> {
  return api.patch<CustomerProfile>('/customer/profile', data);
}

export async function changePassword(data: ChangePasswordInput): Promise<void> {
  await api.patch('/customer/profile/password', data);
}

export async function changeEmail(data: ChangeEmailInput): Promise<void> {
  await api.patch('/customer/profile/email', data);
}

export async function getCustomerOrders(): Promise<CustomerOrdersResponse> {
  return api.get<CustomerOrdersResponse>('/customer/orders');
}

export async function getCustomerOrder(id: string): Promise<CustomerOrder> {
  return api.get<CustomerOrder>(`/customer/orders/${id}`);
}
