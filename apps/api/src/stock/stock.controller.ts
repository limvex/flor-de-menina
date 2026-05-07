import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@flor/database';
import { StockService } from './stock.service';
import { SettingsService } from '../settings/settings.service';
import { ListStockDto } from './dto/list-stock.dto';
import { CreateMovementDto } from './dto/create-movement.dto';
import { QuickSaleDto } from './dto/quick-sale.dto';
import { ListMovementsDto } from './dto/list-movements.dto';
import { Response } from 'express';

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(
    private stockService: StockService,
    private settingsService: SettingsService,
  ) {}

  @Get()
  async list(@Query() filter: ListStockDto) {
    const threshold = await this.settingsService.getLowStockThreshold();
    return this.stockService.listStock(filter, threshold);
  }

  @Get('summary')
  async summary() {
    const threshold = await this.settingsService.getLowStockThreshold();
    return this.stockService.getSummary(threshold);
  }

  @Post('movements')
  async createMovement(
    @Body() dto: CreateMovementDto,
    @CurrentUser() user: User,
  ) {
    return this.stockService.createMovement(dto, user.id);
  }

  @Post('quick-sale')
  async quickSale(@Body() dto: QuickSaleDto, @CurrentUser() user: User) {
    return this.stockService.quickSale(dto, user.id);
  }

  @Get('movements')
  async listMovements(@Query() filter: ListMovementsDto) {
    return this.stockService.listMovements(filter);
  }

  @Get('movements/export')
  async exportMovements(
    @Query() filter: ListMovementsDto,
    @Res() res: Response,
  ) {
    const csv = await this.stockService.exportMovementsCsv(filter);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="estoque-${Date.now()}.csv"`,
    );
    res.send(csv);
  }
}
