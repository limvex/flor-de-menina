import { IsOptional, IsString, IsInt, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum StockStatusFilter {
  OK = 'ok',
  LOW = 'low',
  OUT = 'out',
}

export enum StockSortField {
  NAME = 'name',
  STOCK = 'stock',
  UPDATED = 'updated',
}

export class ListStockQuery {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsEnum(StockStatusFilter)
  status?: StockStatusFilter;

  @IsOptional()
  @IsEnum(StockSortField)
  sort?: StockSortField;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}
