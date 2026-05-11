export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethod = 'PIX' | 'CREDIT_CARD';

export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED' | 'CANCELLED';

import type { ShippingOption } from './shipping.schema';
export type { ShippingOption } from './shipping.schema';

export interface CreateOrderInput {
  addressId: string;
  shippingOption: {
    carrier: string;
    service: string;
    cost: number;
    estimatedDays: number;
  };
  paymentMethod: PaymentMethod;
  cpf: string;
  notes?: string;
}

export interface OrderAddressSnapshot {
  recipientName: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
}

export interface OrderItemResponse {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  variantSize: string | null;
  variantColor: string | null;
  productImageUrl: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface PaymentResponse {
  id: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  installments: number;
  pixCopyPaste: string | null;
  qrCodeBase64: string | null;
  pixExpiresAt: string | null;
  paidAt: string | null;
}

export interface ShippingResponse {
  id: string;
  carrier: string;
  serviceName: string;
  trackingCode: string | null;
  estimatedDays: number | null;
  cost: number;
  shippedAt: string | null;
  deliveredAt: string | null;
}

export interface OrderResponse {
  id: string;
  number: string;
  status: OrderStatus;
  cpf: string | null;
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  shippingAddress: OrderAddressSnapshot;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItemResponse[];
  payment: PaymentResponse | null;
  shipping: ShippingResponse | null;
}

export type CheckoutStep = 1 | 2 | 3 | 4;

export interface CheckoutIdentification {
  name: string;
  email: string;
  cpf: string;
  phone: string;
}

export interface CheckoutAddress {
  addressId: string;
  snapshot: {
    id: string;
    label: string | null;
    recipientName: string;
    zipCode: string;
    street: string;
    number: string;
    complement: string | null;
    neighborhood: string;
    city: string;
    state: string;
    country: string;
    isDefaultShipping: boolean;
    isDefaultBilling: boolean;
  };
}

export interface CheckoutPayment {
  method: PaymentMethod;
  /** Só em memória no checkout — nunca persistir (token MP ou mock). */
  cardToken?: string;
  paymentMethodId?: string;
  installments?: number;
}

/** Resposta de POST /payments/process (PIX). */
export interface ProcessPaymentPixResponse {
  paymentId: string;
  method: 'PIX';
  status: PaymentStatus;
  pix: {
    qrCode: string;
    qrCodeBase64: string;
    copyPaste: string;
    expiresAt: string;
  };
}

/** Resposta de POST /payments/process (cartão). */
export interface ProcessPaymentCardResponse {
  paymentId: string;
  method: 'CREDIT_CARD';
  status: PaymentStatus;
  card?: {
    last4: string | null;
    brand: string | null;
    installments: number;
  };
  failureReason?: string | null;
}

export type ProcessPaymentResponse = ProcessPaymentPixResponse | ProcessPaymentCardResponse;

/** Resposta de GET /payments/:id/status (polling). */
export interface PaymentPollStatusResponse {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string | null;
  pix?: {
    qrCode: string | null;
    qrCodeBase64: string | null;
    copyPaste: string | null;
    expiresAt: string | null;
  };
  card?: {
    last4: string | null;
    brand: string | null;
    installments: number;
  };
  failureReason?: string | null;
}

export interface CheckoutState {
  step: CheckoutStep;
  identification: CheckoutIdentification | null;
  address: CheckoutAddress | null;
  shipping: ShippingOption | null;
  payment: CheckoutPayment | null;
}
