export interface OrderConfirmationEmailPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export interface PaymentFailureEmailPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: string;
}

export interface RefundEmailPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
}
