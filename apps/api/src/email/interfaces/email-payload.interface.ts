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

export interface OrderShippedEmailPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  trackingCode: string;
  trackingUrl: string;
  shippingMethod: string;
  /** Dias úteis / corridos conforme cotação de frete */
  estimatedDays?: number | null;
  estimatedDeliveryLabel?: string;
  items: Array<{ name: string; quantity: number; imageUrl?: string | null }>;
  shippingAddressSummary: string;
}

export interface OrderDeliveredEmailPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{ name: string; quantity: number; imageUrl?: string | null }>;
  shippingAddressSummary: string;
}

export interface OrderCancelledEmailPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason?: string;
}
