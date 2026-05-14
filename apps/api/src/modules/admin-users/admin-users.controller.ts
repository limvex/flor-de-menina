import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/strategies/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AdminUsersService } from './admin-users.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard)
export class AdminUsersController {
  constructor(private readonly service: AdminUsersService) {}

  @Get()
  list() {
    return this.service.listAdmins();
  }

  @Post()
  create(
    @Body() dto: CreateAdminDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.service.createAdmin(dto, currentUserId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
    return this.service.updateAdmin(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser('id') currentUserId: string) {
    return this.service.deleteAdmin(id, currentUserId);
  }
}
