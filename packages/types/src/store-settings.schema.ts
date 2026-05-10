import type { BrazilRegion } from './shipping.schema';

export interface StoreSettingsResponse {
  id: string;
  originZipCode: string;
  originAddress: unknown | null;
  freeShippingGlobalThreshold: number | null;
  shippingProvider: string;
  storeName: string;
  storeEmail: string | null;
  storePhone: string | null;
  storeCnpj: string | null;
  updatedAt: string;
}

export interface UpdateStoreSettingsInput {
  originZipCode?: string;
  originAddress?: unknown;
  freeShippingGlobalThreshold?: number | null;
  shippingProvider?: string;
  storeName?: string;
  storeEmail?: string | null;
  storePhone?: string | null;
  storeCnpj?: string | null;
}

export interface RegionShippingRuleResponse {
  id: string;
  region: BrazilRegion;
  freeShippingMin: number | null;
  isActive: boolean;
  updatedAt: string;
}

export interface UpdateRegionRuleInput {
  freeShippingMin?: number | null;
  isActive?: boolean;
}

export interface ShippingSettingsResponse {
  settings: StoreSettingsResponse;
  regionRules: RegionShippingRuleResponse[];
}
