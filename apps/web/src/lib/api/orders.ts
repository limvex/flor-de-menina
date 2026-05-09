import { api } from './client';
import type { OrderResponse, ShippingOption, CreateOrderInput } from '@flor/types';

export async function getShippingOptions(subtotal: number): Promise<ShippingOption[]> {
  return api.get<ShippingOption[]>(`/orders/shipping-options?subtotal=${subtotal}`);
}

export async function createOrder(data: CreateOrderInput): Promise<OrderResponse> {
  return api.post<OrderResponse>('/orders', data);
}

export async function getOrder(id: string): Promise<OrderResponse> {
  return api.get<OrderResponse>(`/orders/${id}`);
}
