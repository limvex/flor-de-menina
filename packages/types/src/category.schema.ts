import type { SizeChart } from './size-chart.schema';

export interface CategoryDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  parentId: string | null;
  sizeChart: SizeChart | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryAdminDto extends CategoryDto {
  effectiveSizeChart: SizeChart | null;
  parent: Pick<CategoryDto, 'id' | 'name' | 'slug'> | null;
  _count: { children: number; products: number };
}

export interface CategoryTree extends CategoryDto {
  effectiveSizeChart: SizeChart | null;
  children: CategoryTree[];
}

// Simplified version for public navigation (no _count, no effectiveSizeChart)
export interface CategoryPublicDto {
  id: string;
  slug: string;
  name: string;
  parentId: string | null;
  sizeChart: SizeChart | null;
  isActive: boolean;
  sortOrder: number;
  children: CategoryPublicDto[];
}
