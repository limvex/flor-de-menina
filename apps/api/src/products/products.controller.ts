import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/strategies/public.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import {
  ListProductsDto,
  ListPublicProductsDto,
} from './dto/list-products.dto';
import { UpsertVariantsDto, BulkSetActiveDto } from './dto/upsert-variants.dto';
import { UserRole } from '@flor/database';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  // ── Público ──────────────────────────────────────────────────

  @Get('public')
  @Public()
  listPublic(@Query() dto: ListPublicProductsDto) {
    return this.productsService.listPublic(dto);
  }

  @Get('public/:slug')
  @Public()
  getBySlug(@Param('slug') slug: string) {
    return this.productsService.getBySlug(slug);
  }

  // ── Admin ─────────────────────────────────────────────────────

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getStats() {
    return this.productsService.getStats();
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  list(@Query() dto: ListProductsDto) {
    return this.productsService.list(dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getById(@Param('id') id: string) {
    return this.productsService.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  softDelete(@Param('id') id: string) {
    return this.productsService.softDelete(id);
  }

  @Post(':id/restore')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  restore(@Param('id') id: string) {
    return this.productsService.restore(id);
  }

  @Put(':id/variants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  upsertVariants(@Param('id') id: string, @Body() dto: UpsertVariantsDto) {
    return this.productsService.upsertVariants(id, dto);
  }

  @Post('bulk/set-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  bulkSetActive(@Body() dto: BulkSetActiveDto) {
    return this.productsService.bulkSetActive(dto.ids, dto.active);
  }
}
