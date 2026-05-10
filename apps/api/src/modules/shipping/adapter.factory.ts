import { Injectable, NotFoundException } from '@nestjs/common';
import type { ShippingAdapter } from './adapters/shipping-adapter.interface';
import { MockShippingAdapter } from './adapters/mock.adapter';
import { MelhorEnvioAdapter } from './adapters/melhor-envio.adapter';

@Injectable()
export class AdapterFactory {
  constructor(
    private readonly mock: MockShippingAdapter,
    private readonly melhorEnvio: MelhorEnvioAdapter,
  ) {}

  get(provider: string): ShippingAdapter {
    switch (provider) {
      case 'mock':
        return this.mock;
      case 'melhor_envio':
        return this.melhorEnvio;
      default:
        throw new NotFoundException(
          `Provedor de frete desconhecido: ${provider}`,
        );
    }
  }
}
