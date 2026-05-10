import {
  Body,
  Controller,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { QuoteShippingDto } from './dto/quote-shipping.dto';

@Controller('shipping')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('quote')
  quote(@Body() dto: QuoteShippingDto) {
    return this.shippingService.quote(dto);
  }
}
