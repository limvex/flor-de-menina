export type Money = number;

export type ID = string;

export type Pagination = {
  page: number;
  limit: number;
  total: number;
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'OPERATOR';
  mustChangePassword: boolean;
};

export type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
};

export { SizeChartSchema } from './size-chart.schema';
export type { SizeChart } from './size-chart.schema';
export type {
  CategoryDto,
  CategoryAdminDto,
  CategoryTree,
  CategoryPublicDto,
} from './category.schema';
export { LOW_STOCK_THRESHOLD } from './stock.schema';
export { FREE_SHIPPING_THRESHOLD, CART_RESERVATION_MINUTES } from './cart.schema';
export type {
  CartResponse,
  CartItemResponse,
  CartItemProductInfo,
  CartItemVariantInfo,
  MergeCartResponse,
  MergeDiscardedItem,
  LocalCartItem,
} from './cart.schema';
export type {
  StockMovementType,
  StockMovementSource,
  StockStatus,
  ProductWithStockSummary,
  VariantStockSummary,
  VariantStockDetail,
  StockMovementHistoryItem,
} from './stock.schema';
export type {
  WishlistItem,
  WishlistProduct,
  WishlistProductImage,
  WishlistItemVariant,
  WishlistResponse,
} from './wishlist.schema';
export type {
  Address,
  CreateAddressInput,
  UpdateAddressInput,
  ViaCepResponse,
} from './address.schema';
export type {
  CustomerProfile,
  UpdateProfileInput,
  ChangePasswordInput,
  ChangeEmailInput,
} from './customer-profile.schema';
export type {
  OrderStatus,
  OrderItemSnapshot,
  CustomerOrder,
  CustomerOrdersResponse,
} from './customer-order.schema';
export type {
  BrazilRegion,
  ShippingOption,
  ShippingQuoteInput,
  QuoteShippingRequest,
  QuoteShippingResponse,
  MelhorEnvioConnectionStatus,
} from './shipping.schema';
export type {
  PaymentMethod,
  PaymentStatus,
  CreateOrderInput,
  OrderAddressSnapshot,
  OrderItemResponse,
  PaymentResponse,
  ShippingResponse,
  OrderResponse,
  CheckoutStep,
  CheckoutIdentification,
  CheckoutAddress,
  CheckoutPayment,
  CheckoutState,
  ProcessPaymentPixResponse,
  ProcessPaymentCardResponse,
  ProcessPaymentResponse,
  PaymentPollStatusResponse,
} from './order.schema';
export type {
  StoreSettingsResponse,
  UpdateStoreSettingsInput,
  RegionShippingRuleResponse,
  UpdateRegionRuleInput,
  ShippingSettingsResponse,
} from './store-settings.schema';
export type {
  CouponType,
  CouponValidationResult,
  CouponValidationError,
  CouponValidateItem,
  ValidateCouponRequest,
  CouponSummary,
  CouponUsageSummary,
  CouponStats,
  CreateCouponInput,
  UpdateCouponInput,
} from './coupon.schema';
export type {
  InstitutionalPageFormValues,
  InstitutionalPagePublic,
  InstitutionalPageSummary,
  InstitutionalPageAdmin,
} from './institutional-page.schema';
export { institutionalPageFormSchema } from './institutional-page.schema';
export type { HomePageContentResponse, UpdateHomePageContentInput } from './home-content.schema';
