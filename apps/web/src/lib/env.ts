import { z } from 'zod';

const clientSchema = z.object({
  NEXT_PUBLIC_API_URL: z.string().url(),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
  NEXT_PUBLIC_MP_PUBLIC_KEY: z.string().optional(),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
});

const serverSchema = clientSchema.extend({
  INTERNAL_API_URL: z.string().url().optional(),
  COOKIE_DOMAIN: z.string().optional(),
});

export type ClientEnv = z.infer<typeof clientSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

function readSiteUrl(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.WEB_URL?.trim() ||
    process.env.FRONTEND_URL?.trim() ||
    process.env.APP_URL?.trim()
  );
}

export const clientEnv: ClientEnv = clientSchema.parse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_SITE_URL: readSiteUrl(),
  NEXT_PUBLIC_MP_PUBLIC_KEY: process.env.NEXT_PUBLIC_MP_PUBLIC_KEY,
  NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
});

export function getServerEnv(): ServerEnv {
  const internal = process.env.INTERNAL_API_URL?.trim();
  return serverSchema.parse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL: readSiteUrl(),
    NEXT_PUBLIC_MP_PUBLIC_KEY: process.env.NEXT_PUBLIC_MP_PUBLIC_KEY,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    INTERNAL_API_URL: internal && internal.length > 0 ? internal : undefined,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN?.trim() || undefined,
  });
}
