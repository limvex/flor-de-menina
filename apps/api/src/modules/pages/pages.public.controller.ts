import { Controller, Get, Param } from '@nestjs/common';
import { PagesService } from './pages.service';

@Controller('pages')
export class PagesPublicController {
  constructor(private readonly pagesService: PagesService) {}

  @Get()
  listActive() {
    return this.pagesService.findAllPublicSummary();
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.pagesService.findPublicBySlug(slug);
  }
}
