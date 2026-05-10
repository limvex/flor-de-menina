import { api } from './client';
import type {
  OrderResponse,
  CreateOrderInput,
  QuoteShippingRequest,
  QuoteShippingResponse,
} from '@flor/types';

export async function quoteShipping(data: QuoteShippingRequest): Promise<QuoteShippingResponse> {
  return api.post<QuoteShippingResponse>('/shipping/quote', data);
}

export async function createOrder(data: CreateOrderInput): Promise<OrderResponse> {
  return api.post<OrderResponse>('/orders', data);
}

export async function getOrder(id: string): Promise<OrderResponse> {
  return api.get<OrderResponse>(`/orders/${id}`);
}
