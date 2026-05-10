export type BrazilRegion = 'N' | 'NE' | 'CO' | 'SE' | 'S';

export interface ShippingQuoteInput {
  originZipCode: string;
  destinationZipCode: string;
  package: {
    weight: number;
    width: number;
    height: number;
    length: number;
  };
  insuranceValue: number;
}

export interface ShippingOption {
  id: string;
  carrier: string;
  service: string;
  cost: number;
  estimatedDays: number;
  label: string;
  meEnvelopeId?: string;
}

export interface QuoteShippingRequest {
  destinationZipCode: string;
  subtotal: number;
  items: Array<{
    variantId: string;
    quantity: number;
  }>;
}

export interface QuoteShippingResponse {
  options: ShippingOption[];
  usedFallback: boolean;
}

export interface MelhorEnvioConnectionStatus {
  connected: boolean;
  expiresAt?: string;
}
