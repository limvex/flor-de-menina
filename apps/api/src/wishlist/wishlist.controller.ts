import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { CustomerJwtGuard } from '../auth/customer/customer-jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@flor/database';

@Controller('wishlist')
@UseGuards(CustomerJwtGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  async list(@CurrentUser() user: User) {
    return this.wishlistService.list(user.id);
  }

  @Get('ids')
  async listIds(@CurrentUser() user: User) {
    return { ids: await this.wishlistService.getProductIdsInWishlist(user.id) };
  }

  @Post()
  async add(@Body() dto: AddToWishlistDto, @CurrentUser() user: User) {
    return this.wishlistService.add(user.id, dto);
  }

  @Delete(':productId')
  async remove(
    @Param('productId') productId: string,
    @Query('variantId') variantId: string | undefined,
    @CurrentUser() user: User,
  ) {
    return this.wishlistService.remove(user.id, productId, variantId);
  }
}
