export type CouponType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';

export const MAX_COUPON_CODE_LENGTH = 30;

export interface CouponValidationError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: {
    id: string;
    code: string;
    type: CouponType;
    description: string | null;
  };
  discount: number;
  appliedToItemsCount: number;
  totalItemsCount: number;
  finalSubtotal: number;
  finalShipping: number;
  errors?: CouponValidationError[];
}

export interface CouponValidateItem {
  variantId: string;
  quantity: number;
  price: number;
  categoryId: string;
}

export interface ValidateCouponRequest {
  code: string;
  items: CouponValidateItem[];
  subtotal: number;
  shippingCost?: number;
}

export interface CouponSummary {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  maxTotalUses: number | null;
  maxUsesPerCustomer: number;
  minCartValue: number | null;
  maxDiscountAmount: number | null;
  firstOrderOnly: boolean;
  categoryIds: string[];
  totalUses: number;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface CouponUsageSummary {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  discountAmount: number;
  createdAt: string;
}

export interface CouponStats {
  totalUses: number;
  maxTotalUses: number | null;
  totalRevenue: number;
  avgOrderValue: number | null;
}

export interface CreateCouponInput {
  code: string;
  description?: string;
  type: CouponType;
  value: number;
  validFrom: string;
  validUntil: string;
  isActive?: boolean;
  maxTotalUses?: number | null;
  maxUsesPerCustomer?: number;
  minCartValue?: number | null;
  maxDiscountAmount?: number | null;
  firstOrderOnly?: boolean;
  categoryIds?: string[];
}

export interface UpdateCouponInput extends Partial<CreateCouponInput> {}
