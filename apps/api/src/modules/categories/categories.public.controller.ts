import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesPublicController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  findTree() {
    return this.service.findPublicTree();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }
}
