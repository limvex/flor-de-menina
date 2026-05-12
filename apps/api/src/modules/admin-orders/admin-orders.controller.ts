import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@flor/database';
import { AdminOrdersService } from './admin-orders.service';
import { ListAdminOrdersQuery } from './dto/list-admin-orders.query';

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

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.adminOrdersService.getById(id);
  }
}
