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
  PaymentMethod,
  PaymentStatus,
  ShippingOption,
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
} from './order.schema';
