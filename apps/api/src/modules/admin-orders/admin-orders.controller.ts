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
import { UserRole, type User } from '@flor/database';
import { JwtAuthGuard } from '../../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AdminOrdersService } from './admin-orders.service';
import { ListAdminOrdersQuery } from './dto/list-admin-orders.query';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPERATOR)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AdminOrdersController {
  constructor(private readonly adminOrdersService: AdminOrdersService) {}

  @Get()
  list(@Query() query: ListAdminOrdersQuery) {
    return this.adminOrdersService.list(query);
  }

  @Get(':id/valid-transitions')
  validTransitions(@Param('id') id: string) {
    return this.adminOrdersService.getValidTransitionsForOrder(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.adminOrdersService.updateStatus(id, dto, user.id);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.adminOrdersService.getById(id);
  }
}
