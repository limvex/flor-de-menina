import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Redirect,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '@flor/database';
import { ShippingService } from './shipping.service';
import { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';
import { UpdateRegionRuleDto } from './dto/update-region-rule.dto';

@Controller('admin/shipping')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.OPERATOR)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ShippingAdminController {
  constructor(private readonly shippingService: ShippingService) {}

  @Get('settings')
  getSettings() {
    return this.shippingService.getSettings();
  }

  @Patch('settings')
  updateSettings(@Body() dto: UpdateStoreSettingsDto) {
    return this.shippingService.updateSettings(dto);
  }

  @Patch('regions/:region')
  updateRegionRule(
    @Param('region') region: string,
    @Body() dto: UpdateRegionRuleDto,
  ) {
    return this.shippingService.updateRegionRule(region, dto);
  }

  @Get('me/auth-url')
  async getMeAuthUrl() {
    const url = await this.shippingService.getMeAuthUrl();
    return { url };
  }

  @Get('me/callback')
  @Redirect()
  async handleMeCallback(@Query('code') code: string) {
    const frontendUrl = process.env.WEB_URL ?? 'http://localhost:3000';
    const redirectUrl = await this.shippingService.handleMeCallback(
      code,
      frontendUrl,
    );
    return { url: redirectUrl, statusCode: 302 };
  }

  @Post('me/disconnect')
  disconnectMe() {
    return this.shippingService.disconnectMe();
  }

  @Get('me/status')
  getMeStatus() {
    return this.shippingService.getMeStatus();
  }

  @Post('test-quote')
  testQuote(@Body('destinationZipCode') cep: string) {
    return this.shippingService.testQuote(cep ?? '01310100');
  }
}
