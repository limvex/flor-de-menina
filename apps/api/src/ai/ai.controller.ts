import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { IsString, IsOptional, IsArray } from 'class-validator';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AiService } from './ai.service';
import { UserRole } from '@flor/database';
import { Throttle } from '@nestjs/throttler';

class GenerateDescriptionDto {
  @IsString() name: string;
  @IsString() categoryId: string;
  @IsArray() @IsOptional() attributes?: string[];
  @IsString() @IsOptional() tone?: string;
  @IsString() @IsOptional() length?: string;
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('ai')
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('generate-description')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  generateDescription(@Body() dto: GenerateDescriptionDto) {
    return this.aiService.generateProductDescription(dto);
  }

  @Get('credit-balance')
  getCreditBalance() {
    return this.aiService.getCreditInfo();
  }
}
