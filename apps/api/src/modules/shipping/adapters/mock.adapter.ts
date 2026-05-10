import { Injectable } from '@nestjs/common';
import type {
  ShippingOption,
  ShippingQuoteInput,
  BrazilRegion,
} from '@flor/types';
import type { ShippingAdapter } from './shipping-adapter.interface';
import { getRegionFromCep } from '../utils/cep-to-region';

const BASE_DAYS: Record<BrazilRegion, number> = {
  NE: 4,
  SE: 8,
  S: 10,
  CO: 10,
  N: 12,
};

@Injectable()
export class MockShippingAdapter implements ShippingAdapter {
  getName(): string {
    return 'mock';
  }

  async quote(input: ShippingQuoteInput): Promise<ShippingOption[]> {
    const region = getRegionFromCep(input.destinationZipCode);
    const baseDays = BASE_DAYS[region];
    const sedexDays = Math.ceil(baseDays / 2);
    const weightKg = input.package.weight / 1000;

    const pacBase = parseFloat((12.9 + weightKg * 2).toFixed(2));
    const sedexBase = parseFloat((22.9 + weightKg * 3.5).toFixed(2));
    const jadlogBase = parseFloat((pacBase * 0.9).toFixed(2));

    return [
      {
        id: 'pac',
        carrier: 'Correios',
        service: 'PAC',
        cost: pacBase,
        estimatedDays: baseDays,
        label: `PAC — até ${baseDays} dias úteis`,
      },
      {
        id: 'sedex',
        carrier: 'Correios',
        service: 'SEDEX',
        cost: sedexBase,
        estimatedDays: sedexDays,
        label: `SEDEX — até ${sedexDays} dias úteis`,
      },
      {
        id: 'jadlog',
        carrier: 'Jadlog',
        service: 'Econômico',
        cost: jadlogBase,
        estimatedDays: baseDays + 1,
        label: `Jadlog Econômico — até ${baseDays + 1} dias úteis`,
      },
    ];
  }
}
