import type { ShippingOption, ShippingQuoteInput } from '@flor/types';

export interface ShippingAdapter {
  quote(input: ShippingQuoteInput): Promise<ShippingOption[]>;
  getName(): string;
}
