import { Module } from '@nestjs/common';
import { ShippingController } from './shipping.controller';
import { ShippingAdminController } from './shipping.admin.controller';
import { ShippingService } from './shipping.service';
import { AdapterFactory } from './adapter.factory';
import { MockShippingAdapter } from './adapters/mock.adapter';
import { MelhorEnvioAdapter } from './adapters/melhor-envio.adapter';

@Module({
  controllers: [ShippingController, ShippingAdminController],
  providers: [
    ShippingService,
    AdapterFactory,
    MockShippingAdapter,
    MelhorEnvioAdapter,
  ],
  exports: [ShippingService],
})
export class ShippingModule {}
