import { Controller, Get, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';
import Redis from 'ioredis';
import { prisma } from '@flor/database';
import { resolveRedisUrlFromProcess } from '../../config/env.schema';

@Controller('health')
@SkipThrottle()
export class HealthController {
  private readonly version: string;

  constructor() {
    try {
      const pkgPath = join(__dirname, '../../../package.json');
      const raw = readFileSync(pkgPath, 'utf8');
      this.version =
        (JSON.parse(raw) as { version?: string }).version ?? '0.0.0';
    } catch {
      this.version = process.env.npm_package_version ?? '0.0.0';
    }
  }

  @Get()
  async check(@Res() res: Response) {
    const startedAt = Date.now();

    const dbCheck = await this.checkDatabase();
    const redisCheck = await this.checkRedis();

    const allOk = dbCheck === 'ok' && redisCheck === 'ok';
    const status = allOk ? 'ok' : 'degraded';

    const body = {
      status,
      timestamp: new Date().toISOString(),
      version: this.version,
      uptime: process.uptime(),
      durationMs: Date.now() - startedAt,
      checks: {
        database: dbCheck,
        redis: redisCheck,
      },
    };

    res.status(allOk ? 200 : 503).json(body);
  }

  private async checkDatabase(): Promise<string> {
    try {
      await Promise.race([
        prisma.$queryRaw`SELECT 1`,
        new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error('timeout')), 2000),
        ),
      ]);
      return 'ok';
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return `error: ${msg}`;
    }
  }

  private async checkRedis(): Promise<string> {
    const url = resolveRedisUrlFromProcess();
    const redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 2000,
    });
    try {
      await Promise.race([
        redis.ping(),
        new Promise<never>((_, rej) =>
          setTimeout(() => rej(new Error('timeout')), 1000),
        ),
      ]);
      return 'ok';
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return `error: ${msg}`;
    } finally {
      redis.disconnect();
    }
  }
}
