import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { CustomerJwtGuard } from '../../auth/customer/customer-jwt.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { User } from '@flor/database';

@Controller('addresses')
@UseGuards(CustomerJwtGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.addressesService.findAll(user.id);
  }

  @Post()
  create(@Body() dto: CreateAddressDto, @CurrentUser() user: User) {
    return this.addressesService.create(user.id, dto);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAddressDto,
    @CurrentUser() user: User,
  ) {
    return this.addressesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.addressesService.remove(user.id, id);
  }

  @Patch(':id/set-default-shipping')
  setDefaultShipping(@Param('id') id: string, @CurrentUser() user: User) {
    return this.addressesService.setDefaultShipping(user.id, id);
  }

  @Patch(':id/set-default-billing')
  setDefaultBilling(@Param('id') id: string, @CurrentUser() user: User) {
    return this.addressesService.setDefaultBilling(user.id, id);
  }
}
