import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CustomerProfileService } from './customer-profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { CustomerJwtGuard } from '../../auth/customer/customer-jwt.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { User } from '@flor/database';

@Controller('customer')
@UseGuards(CustomerJwtGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class CustomerProfileController {
  constructor(private readonly service: CustomerProfileService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: User) {
    return this.service.getProfile(user.id);
  }

  @Patch('profile')
  updateProfile(@Body() dto: UpdateProfileDto, @CurrentUser() user: User) {
    return this.service.updateProfile(user.id, dto);
  }

  @Patch('profile/email')
  changeEmail(@Body() dto: ChangeEmailDto, @CurrentUser() user: User) {
    return this.service.changeEmail(user.id, dto);
  }

  @Patch('profile/password')
  changePassword(@Body() dto: ChangePasswordDto, @CurrentUser() user: User) {
    return this.service.changePassword(user.id, dto);
  }

  @Get('orders')
  getOrders(@CurrentUser() user: User) {
    return this.service.getOrders(user.id);
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.getOrder(user.id, id);
  }
}
