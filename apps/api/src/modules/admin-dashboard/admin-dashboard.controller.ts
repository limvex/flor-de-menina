import {
  Controller,
  Get,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@flor/database';
import { AdminDashboardService } from './admin-dashboard.service';
import { DashboardSummaryQuery } from './dto/dashboard-summary.query';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPERATOR)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('summary')
  getSummary(@Query() query: DashboardSummaryQuery) {
    return this.adminDashboardService.getSummary(
      query.preset,
      query.from,
      query.to,
    );
  }
}
