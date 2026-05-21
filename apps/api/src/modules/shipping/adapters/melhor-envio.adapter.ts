import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { prisma } from '@flor/database';
import type { ShippingOption, ShippingQuoteInput } from '@flor/types';
import type { ShippingAdapter } from './shipping-adapter.interface';
import { encrypt, decrypt } from '../utils/encryption.util';

interface MeShipmentOption {
  id: number;
  name: string;
  company: { name: string };
  price: string;
  custom_price: string;
  delivery_time: number;
  error?: string;
}

@Injectable()
export class MelhorEnvioAdapter implements ShippingAdapter {
  private readonly logger = new Logger(MelhorEnvioAdapter.name);

  getName(): string {
    return 'melhor_envio';
  }

  private get baseUrl(): string {
    return (
      process.env.MELHOR_ENVIO_BASE_URL ?? 'https://sandbox.melhorenvio.com.br'
    );
  }

  async quote(input: ShippingQuoteInput): Promise<ShippingOption[]> {
    const token = await this.ensureValidToken();

    const body = {
      from: { postal_code: input.originZipCode.replace(/\D/g, '') },
      to: { postal_code: input.destinationZipCode.replace(/\D/g, '') },
      package: {
        height: input.package.height,
        width: input.package.width,
        length: input.package.length,
        weight: (input.package.weight / 1000).toFixed(3),
      },
      options: {
        insurance_value: input.insuranceValue,
        receipt: false,
        own_hand: false,
      },
    };

    const res = await fetch(`${this.baseUrl}/api/v2/me/shipment/calculate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Flor de Menina E-commerce (contato@flordemenina.store)',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new InternalServerErrorException(
        `Melhor Envio retornou ${res.status}: ${errText}`,
      );
    }

    const data = (await res.json()) as MeShipmentOption[];

    return data
      .filter((opt) => !opt.error && opt.price)
      .map((opt) => ({
        id: `me-${opt.id}`,
        carrier: opt.company.name,
        service: opt.name,
        cost: parseFloat(opt.custom_price || opt.price),
        estimatedDays: opt.delivery_time,
        label: `${opt.name} — até ${opt.delivery_time} dias úteis`,
        meEnvelopeId: String(opt.id),
      }));
  }

  async getAuthUrl(): Promise<string> {
    const clientId = process.env.MELHOR_ENVIO_CLIENT_ID;
    const redirectUri = process.env.MELHOR_ENVIO_REDIRECT_URI;
    if (!clientId || !redirectUri) {
      throw new BadRequestException(
        'MELHOR_ENVIO_CLIENT_ID ou MELHOR_ENVIO_REDIRECT_URI não configurados',
      );
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope:
        'shipping-calculate shipping-checkout shipping-companies shipping-generate shipping-preview shipping-print shipping-tracking orders-read',
    });

    return `${this.baseUrl}/oauth/authorize?${params.toString()}`;
  }

  async handleCallback(code: string): Promise<void> {
    const clientId = process.env.MELHOR_ENVIO_CLIENT_ID;
    const clientSecret = process.env.MELHOR_ENVIO_CLIENT_SECRET;
    const redirectUri = process.env.MELHOR_ENVIO_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException(
        'Credenciais do Melhor Envio não configuradas',
      );
    }

    const res = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new BadRequestException(
        `Falha ao trocar código por token: ${errText}`,
      );
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      token_type: string;
      scope?: string;
    };

    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    await prisma.melhorEnvioCredentials.upsert({
      where: { id: 'singleton' },
      update: {
        accessToken: encrypt(data.access_token),
        refreshToken: encrypt(data.refresh_token),
        expiresAt,
        scope: data.scope ?? null,
      },
      create: {
        id: 'singleton',
        accessToken: encrypt(data.access_token),
        refreshToken: encrypt(data.refresh_token),
        expiresAt,
        scope: data.scope ?? null,
      },
    });

    this.logger.log('Melhor Envio: tokens salvos com sucesso');
  }

  async disconnect(): Promise<void> {
    await prisma.melhorEnvioCredentials.deleteMany({
      where: { id: 'singleton' },
    });
    this.logger.log('Melhor Envio: credenciais removidas');
  }

  async getStatus(): Promise<{ connected: boolean; expiresAt?: string }> {
    const creds = await prisma.melhorEnvioCredentials.findUnique({
      where: { id: 'singleton' },
    });
    if (!creds) return { connected: false };
    return { connected: true, expiresAt: creds.expiresAt.toISOString() };
  }

  private async ensureValidToken(): Promise<string> {
    const creds = await prisma.melhorEnvioCredentials.findUnique({
      where: { id: 'singleton' },
    });

    if (!creds) {
      throw new BadRequestException('Melhor Envio não está conectado');
    }

    const fiveMinFromNow = new Date(Date.now() + 5 * 60 * 1000);
    if (creds.expiresAt < fiveMinFromNow) {
      this.logger.log('Melhor Envio: token expirado, renovando...');
      return this.refreshToken(creds.refreshToken);
    }

    return decrypt(creds.accessToken);
  }

  private async refreshToken(encryptedRefreshToken: string): Promise<string> {
    const clientId = process.env.MELHOR_ENVIO_CLIENT_ID;
    const clientSecret = process.env.MELHOR_ENVIO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new InternalServerErrorException(
        'Credenciais do Melhor Envio não configuradas para refresh',
      );
    }

    const refreshToken = decrypt(encryptedRefreshToken);

    const res = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new InternalServerErrorException(
        `Falha ao renovar token ME: ${errText}`,
      );
    }

    const data = (await res.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      scope?: string;
    };

    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    await prisma.melhorEnvioCredentials.update({
      where: { id: 'singleton' },
      data: {
        accessToken: encrypt(data.access_token),
        refreshToken: encrypt(data.refresh_token),
        expiresAt,
        scope: data.scope ?? null,
      },
    });

    this.logger.log(
      `Melhor Envio: token renovado, expira em ${expiresAt.toISOString()}`,
    );
    return data.access_token;
  }
}
