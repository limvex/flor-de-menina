export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface OrderItemSnapshot {
  id: string;
  productName: string;
  variantSize: string | null;
  variantColor: string | null;
  productImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface CustomerOrder {
  id: string;
  number: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  couponCode: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemSnapshot[];
  trackingCode: string | null;
  shippingAddress: {
    recipientName: string;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

export interface CustomerOrdersResponse {
  orders: CustomerOrder[];
  total: number;
  page: number;
  limit: number;
}
