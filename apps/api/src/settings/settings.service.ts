import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getLowStockThreshold(): Promise<number> {
    const setting = await this.prisma.setting.findUnique({
      where: { key: 'lowStockThreshold' },
    });
    return (setting?.value as number) ?? 5; // default 5
  }

  async setLowStockThreshold(value: number): Promise<void> {
    await this.prisma.setting.upsert({
      where: { key: 'lowStockThreshold' },
      create: { key: 'lowStockThreshold', value },
      update: { value },
    });
  }
}
