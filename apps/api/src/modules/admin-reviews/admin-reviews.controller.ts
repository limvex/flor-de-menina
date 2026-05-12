import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { UserRole, type User } from '@flor/database';
import { AdminReviewsService } from './admin-reviews.service';
import { ListAdminReviewsQuery } from './dto/list-admin-reviews.query';
import { ModerateReviewDto } from './dto/moderate-review.dto';

@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPERATOR)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AdminReviewsController {
  constructor(private readonly adminReviewsService: AdminReviewsService) {}

  @Get()
  list(@Query() query: ListAdminReviewsQuery) {
    return this.adminReviewsService.list(query);
  }

  @Patch(':id')
  moderate(
    @Param('id') id: string,
    @Body() dto: ModerateReviewDto,
    @CurrentUser() user: User,
  ) {
    return this.adminReviewsService.moderate(id, dto, user.id);
  }
}
