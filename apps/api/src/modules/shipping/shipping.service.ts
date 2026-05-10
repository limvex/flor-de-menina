import {
  BadRequestException,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { prisma, createId } from '@flor/database';
import type { BrazilRegion, QuoteShippingResponse } from '@flor/types';
import type { ShippingSettingsResponse } from '@flor/types';
import { AdapterFactory } from './adapter.factory';
import { MelhorEnvioAdapter } from './adapters/melhor-envio.adapter';
import { getRegionFromCep } from './utils/cep-to-region';
import { buildPackage } from './utils/cart-to-package.util';
import type { QuoteShippingDto } from './dto/quote-shipping.dto';
import type { UpdateStoreSettingsDto } from './dto/update-store-settings.dto';
import type { UpdateRegionRuleDto } from './dto/update-region-rule.dto';
import type { StoreSettings } from '@flor/database';

@Injectable()
export class ShippingService implements OnModuleInit {
  private readonly logger = new Logger(ShippingService.name);

  constructor(
    private readonly adapterFactory: AdapterFactory,
    private readonly melhorEnvioAdapter: MelhorEnvioAdapter,
  ) {}

  async onModuleInit() {
    const encKey = process.env.ENCRYPTION_KEY;
    if (!encKey || encKey.length !== 64) {
      throw new Error(
        "ENCRYPTION_KEY ausente ou inválida. Gere com: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
      );
    }
  }

  async quote(dto: QuoteShippingDto): Promise<QuoteShippingResponse> {
    const settings = await this.getOrCreateSettings();
    const provider = settings.shippingProvider;

    // Buscar dimensões dos produtos
    const variantIds = dto.items.map((i) => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: {
        id: true,
        product: {
          select: { weight: true, width: true, height: true, length: true },
        },
      },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const packageItems = dto.items.map((item) => {
      const v = variantMap.get(item.variantId);
      return {
        variantId: item.variantId,
        quantity: item.quantity,
        weight: v?.product.weight ?? null,
        width: v?.product.width ?? null,
        height: v?.product.height ?? null,
        length: v?.product.length ?? null,
      };
    });

    const pkg = buildPackage(packageItems);

    const adapter = this.adapterFactory.get(provider);
    let options: Awaited<ReturnType<typeof adapter.quote>>;
    let usedFallback = false;

    try {
      options = await adapter.quote({
        originZipCode: settings.originZipCode,
        destinationZipCode: dto.destinationZipCode,
        package: pkg,
        insuranceValue: dto.subtotal,
      });
    } catch (err) {
      this.logger.error(
        `Provedor ${provider} falhou, usando mock como fallback. CEP: ${dto.destinationZipCode}`,
        err instanceof Error ? err.message : String(err),
      );
      const mock = this.adapterFactory.get('mock');
      options = await mock.quote({
        originZipCode: settings.originZipCode,
        destinationZipCode: dto.destinationZipCode,
        package: pkg,
        insuranceValue: dto.subtotal,
      });
      usedFallback = true;
    }

    // Aplicar regra de frete grátis
    const region = getRegionFromCep(dto.destinationZipCode);
    const freeShippingMin = await this.getFreeShippingThreshold(
      region,
      settings,
    );

    if (freeShippingMin !== null && dto.subtotal >= freeShippingMin) {
      const cheapest = options.reduce((a, b) => (a.cost < b.cost ? a : b));
      options.push({
        ...cheapest,
        id: `free-${cheapest.id}`,
        cost: 0,
        label: `Frete grátis — até ${cheapest.estimatedDays} dias úteis`,
      });
    }

    options.sort((a, b) => a.cost - b.cost);

    return { options, usedFallback };
  }

  async getSettings(): Promise<ShippingSettingsResponse> {
    const settings = await this.getOrCreateSettings();
    const regionRules = await prisma.regionShippingRule.findMany({
      orderBy: { region: 'asc' },
    });

    return {
      settings: this.formatSettings(settings),
      regionRules: regionRules.map((r) => ({
        id: r.id,
        region: r.region as BrazilRegion,
        freeShippingMin: r.freeShippingMin ? Number(r.freeShippingMin) : null,
        isActive: r.isActive,
        updatedAt: r.updatedAt.toISOString(),
      })),
    };
  }

  async updateSettings(
    dto: UpdateStoreSettingsDto,
  ): Promise<ShippingSettingsResponse> {
    const current = await this.getOrCreateSettings();

    await prisma.storeSettings.update({
      where: { id: 'singleton' },
      data: {
        originZipCode: dto.originZipCode ?? current.originZipCode,
        originAddress:
          dto.originAddress !== undefined
            ? (dto.originAddress as object)
            : (current.originAddress ?? undefined),
        freeShippingGlobalThreshold:
          dto.freeShippingGlobalThreshold !== undefined
            ? dto.freeShippingGlobalThreshold
            : current.freeShippingGlobalThreshold,
        shippingProvider: dto.shippingProvider ?? current.shippingProvider,
        storeName: dto.storeName ?? current.storeName,
        storeEmail:
          dto.storeEmail !== undefined ? dto.storeEmail : current.storeEmail,
        storePhone:
          dto.storePhone !== undefined ? dto.storePhone : current.storePhone,
        storeCnpj:
          dto.storeCnpj !== undefined ? dto.storeCnpj : current.storeCnpj,
      },
    });

    return this.getSettings();
  }

  async updateRegionRule(
    region: string,
    dto: UpdateRegionRuleDto,
  ): Promise<ShippingSettingsResponse> {
    const validRegions = ['N', 'NE', 'CO', 'SE', 'S'];
    if (!validRegions.includes(region)) {
      throw new BadRequestException(`Região inválida: ${region}`);
    }

    await prisma.regionShippingRule.upsert({
      where: { region: region as BrazilRegion },
      update: {
        freeShippingMin:
          dto.freeShippingMin !== undefined ? dto.freeShippingMin : undefined,
        isActive: dto.isActive !== undefined ? dto.isActive : undefined,
      },
      create: {
        id: createId(),
        region: region as BrazilRegion,
        freeShippingMin: dto.freeShippingMin ?? null,
        isActive: dto.isActive ?? true,
      },
    });

    return this.getSettings();
  }

  getMeAuthUrl() {
    return this.melhorEnvioAdapter.getAuthUrl();
  }

  async handleMeCallback(code: string, frontendUrl: string): Promise<string> {
    await this.melhorEnvioAdapter.handleCallback(code);
    return `${frontendUrl}/admin/configuracoes/frete?connected=true`;
  }

  disconnectMe() {
    return this.melhorEnvioAdapter.disconnect();
  }

  getMeStatus() {
    return this.melhorEnvioAdapter.getStatus();
  }

  async testQuote(destinationZipCode: string): Promise<QuoteShippingResponse> {
    return this.quote({
      destinationZipCode,
      subtotal: 299,
      items: [{ variantId: 'test', quantity: 1 }],
    });
  }

  private async getOrCreateSettings(): Promise<StoreSettings> {
    const existing = await prisma.storeSettings.findUnique({
      where: { id: 'singleton' },
    });
    if (existing) return existing;

    return prisma.storeSettings.create({
      data: {
        id: 'singleton',
        originZipCode: '57000000',
        freeShippingGlobalThreshold: 299,
        shippingProvider: process.env.SHIPPING_PROVIDER ?? 'mock',
      },
    });
  }

  private formatSettings(s: StoreSettings) {
    return {
      id: s.id,
      originZipCode: s.originZipCode,
      originAddress: s.originAddress,
      freeShippingGlobalThreshold: s.freeShippingGlobalThreshold
        ? Number(s.freeShippingGlobalThreshold)
        : null,
      shippingProvider: s.shippingProvider,
      storeName: s.storeName,
      storeEmail: s.storeEmail,
      storePhone: s.storePhone,
      storeCnpj: s.storeCnpj,
      updatedAt: s.updatedAt.toISOString(),
    };
  }

  private async getFreeShippingThreshold(
    region: BrazilRegion,
    settings: StoreSettings,
  ): Promise<number | null> {
    const rule = await prisma.regionShippingRule.findUnique({
      where: { region },
    });
    if (rule?.isActive && rule.freeShippingMin != null) {
      return Number(rule.freeShippingMin);
    }
    if (settings.freeShippingGlobalThreshold != null) {
      return Number(settings.freeShippingGlobalThreshold);
    }
    return null;
  }
}
