import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { StockService } from './stock.service';
import { CreateMovementDto } from './dto/create-movement.dto';
import { CounterSaleDto } from './dto/counter-sale.dto';
import { ListStockQuery } from './dto/list-stock.query';
import { ListMovementsQuery } from './dto/list-movements.query';
import { UserRole, type User } from '@flor/database';

@Controller('admin/stock')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPERATOR)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  listProducts(@Query() query: ListStockQuery) {
    return this.stockService.listProductsWithStock(query);
  }

  @Get('variants/:variantId')
  getVariant(@Param('variantId') variantId: string) {
    return this.stockService.getVariantStock(variantId);
  }

  @Get('variants/:variantId/movements')
  listMovements(
    @Param('variantId') variantId: string,
    @Query() query: ListMovementsQuery,
  ) {
    return this.stockService.listMovements(variantId, query);
  }

  @Post('movements')
  createMovement(@Body() dto: CreateMovementDto, @CurrentUser() user: User) {
    return this.stockService.createMovement(dto, user?.id ?? null);
  }

  @Post('counter-sale')
  counterSale(@Body() dto: CounterSaleDto, @CurrentUser() user: User) {
    return this.stockService.createCounterSale(dto, user?.id ?? null);
  }
}
