import { z } from 'zod';

const HEX64 = /^[a-f0-9]{64}$/i;

const baseSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),

    PORT: z.preprocess(
      (v) => v ?? process.env.API_PORT ?? '3333',
      z.coerce.number().int().positive(),
    ),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),

    REDIS_URL: z.string().optional(),
    REDIS_HOST: z.string().optional(),
    REDIS_PORT: z.coerce.number().int().positive().optional(),
    REDIS_PASSWORD: z.string().optional(),

    JWT_SECRET: z
      .string()
      .min(32, 'JWT_SECRET deve ter pelo menos 32 caracteres'),
    JWT_CUSTOMER_SECRET: z
      .string()
      .min(32, 'JWT_CUSTOMER_SECRET deve ter pelo menos 32 caracteres'),
    JWT_CUSTOMER_REFRESH_SECRET: z
      .string()
      .min(32, 'JWT_CUSTOMER_REFRESH_SECRET deve ter pelo menos 32 caracteres'),

    ENCRYPTION_KEY: z.string().optional(),

    PAYMENT_PROVIDER: z.enum(['mock', 'mercado_pago']).default('mock'),
    SHIPPING_PROVIDER: z.enum(['mock', 'melhor_envio']).default('mock'),
    MAIL_PROVIDER: z.enum(['maildev', 'resend']).default('maildev'),

    MP_ACCESS_TOKEN: z.string().optional(),
    MP_PUBLIC_KEY: z.string().optional(),
    MP_WEBHOOK_SECRET: z.string().optional(),

    MELHOR_ENVIO_CLIENT_ID: z.string().optional(),
    MELHOR_ENVIO_CLIENT_SECRET: z.string().optional(),
    MELHOR_ENVIO_REDIRECT_URI: z.string().optional(),
    MELHOR_ENVIO_BASE_URL: z.string().optional(),

    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().optional(),
    RESEND_REPLY_TO: z.string().optional(),

    R2_ACCOUNT_ID: z.string().optional(),
    R2_ENDPOINT: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET_NAME: z.string().optional(),
    R2_PUBLIC_URL: z.string().optional(),

    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    OPENROUTER_API_KEY: z.string().optional(),

    WHATSAPP_SUPPORT_URL: z.string().optional(),
    INSTAGRAM_URL: z.string().optional(),

    ADMIN_SEED_EMAIL: z.string().email().optional(),
    ADMIN_SEED_PASSWORD: z.string().min(8).optional(),

    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  })
  .superRefine((data, ctx) => {
    const needsEncryption =
      data.NODE_ENV === 'production' ||
      data.SHIPPING_PROVIDER === 'melhor_envio';
    if (needsEncryption) {
      if (!data.ENCRYPTION_KEY || !HEX64.test(data.ENCRYPTION_KEY)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ENCRYPTION_KEY'],
          message:
            'ENCRYPTION_KEY deve ter 64 caracteres hex (obrigatória em produção ou com SHIPPING_PROVIDER=melhor_envio)',
        });
      }
    }

    if (data.NODE_ENV === 'production') {
      if (!data.REDIS_URL?.trim() && !data.REDIS_HOST?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['REDIS_URL'],
          message: 'Em produção defina REDIS_URL ou REDIS_HOST',
        });
      }
    }
  });

export type Env = z.infer<typeof baseSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (!cached) {
    throw new Error('parseEnv() ainda não foi executado');
  }
  return cached;
}

/** Usa `process.env` (útil antes de `parseEnv()` e em testes que montam o AppModule sem `main`). */
export function resolveRedisUrlFromProcess(): string {
  const raw = process.env.REDIS_URL?.trim();
  if (raw) return raw;
  const host = process.env.REDIS_HOST?.trim() || 'localhost';
  const port = Number(process.env.REDIS_PORT || '6379') || 6379;
  const pass = process.env.REDIS_PASSWORD?.trim();
  if (pass) {
    return `redis://:${encodeURIComponent(pass)}@${host}:${port}`;
  }
  return `redis://${host}:${port}`;
}

/** Opções de conexão compatíveis com BullMQ / ioredis a partir da URL Redis. */
export function bullMqRedisConnectionFromProcess(): {
  host: string;
  port: number;
  username?: string;
  password?: string;
} {
  const url = resolveRedisUrlFromProcess();
  const u = new URL(url);
  const port = u.port ? Number(u.port) : 6379;
  const opts: {
    host: string;
    port: number;
    username?: string;
    password?: string;
  } = {
    host: u.hostname,
    port,
  };
  if (u.username) {
    opts.username = decodeURIComponent(u.username);
  }
  if (u.password) {
    opts.password = decodeURIComponent(u.password);
  }
  return opts;
}

export function resolveRedisUrl(env: Env): string {
  const raw = env.REDIS_URL?.trim();
  if (raw) return raw;
  const host = env.REDIS_HOST?.trim() || 'localhost';
  const port = env.REDIS_PORT ?? 6379;
  const pass = env.REDIS_PASSWORD?.trim();
  if (pass) {
    return `redis://:${encodeURIComponent(pass)}@${host}:${port}`;
  }
  return `redis://${host}:${port}`;
}

export function parseEnv(): Env {
  if (cached) {
    return cached;
  }

  const parsed = baseSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Variáveis de ambiente inválidas:');
    for (const err of parsed.error.issues) {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    }
    process.exit(1);
  }

  const env = parsed.data;

  if (env.NODE_ENV === 'development') {
    if (!env.OPENROUTER_API_KEY) {
      console.warn(
        '⚠️ OPENROUTER_API_KEY ausente — descrições por IA usam modo mock quando aplicável.',
      );
    }
  }

  if (env.NODE_ENV === 'production') {
    const errors: string[] = [];

    if (env.PAYMENT_PROVIDER === 'mercado_pago') {
      if (!env.MP_ACCESS_TOKEN) {
        errors.push(
          'MP_ACCESS_TOKEN é obrigatória com PAYMENT_PROVIDER=mercado_pago',
        );
      }
      if (!env.MP_PUBLIC_KEY) {
        errors.push(
          'MP_PUBLIC_KEY é obrigatória com PAYMENT_PROVIDER=mercado_pago',
        );
      }
      if (!env.MP_WEBHOOK_SECRET) {
        errors.push(
          'MP_WEBHOOK_SECRET é obrigatória com PAYMENT_PROVIDER=mercado_pago',
        );
      }
    }

    if (env.SHIPPING_PROVIDER === 'melhor_envio') {
      if (!env.MELHOR_ENVIO_CLIENT_ID) {
        errors.push(
          'MELHOR_ENVIO_CLIENT_ID é obrigatória com SHIPPING_PROVIDER=melhor_envio',
        );
      }
      if (!env.MELHOR_ENVIO_CLIENT_SECRET) {
        errors.push(
          'MELHOR_ENVIO_CLIENT_SECRET é obrigatória com SHIPPING_PROVIDER=melhor_envio',
        );
      }
    }

    if (env.MAIL_PROVIDER === 'resend') {
      if (!env.RESEND_API_KEY)
        errors.push('RESEND_API_KEY é obrigatória com MAIL_PROVIDER=resend');
      if (!env.RESEND_FROM_EMAIL) {
        errors.push('RESEND_FROM_EMAIL é obrigatória com MAIL_PROVIDER=resend');
      }
    }

    const r2Missing = [
      !env.R2_ENDPOINT && 'R2_ENDPOINT',
      !env.R2_ACCESS_KEY_ID && 'R2_ACCESS_KEY_ID',
      !env.R2_SECRET_ACCESS_KEY && 'R2_SECRET_ACCESS_KEY',
      !env.R2_BUCKET_NAME && 'R2_BUCKET_NAME',
      !env.R2_PUBLIC_URL && 'R2_PUBLIC_URL',
    ].filter(Boolean);
    if (r2Missing.length) {
      errors.push(
        `Variáveis R2 obrigatórias em produção: ${r2Missing.join(', ')}`,
      );
    }

    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
      errors.push(
        'GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET são obrigatórios em produção',
      );
    }

    if (errors.length) {
      console.error('❌ Configuração de produção incompleta:');
      for (const e of errors) {
        console.error(`  - ${e}`);
      }
      process.exit(1);
    }
  }

  cached = env;
  return env;
}
