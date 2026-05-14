import { resolve } from 'path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';

// Carrega `.env` da raiz do monorepo (mesmo arquivo que a API Nest usa).
const monorepoRoot = resolve(__dirname, '../..');
loadEnvConfig(monorepoRoot, process.env.NODE_ENV !== 'production');

const mpPublicKey =
  process.env.NEXT_PUBLIC_MP_PUBLIC_KEY?.trim() || process.env.MP_PUBLIC_KEY?.trim() || '';

/** Garante que variáveis públicas entrem no bundle do cliente (Turbopack/monorepo). */
const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@mercadopago/sdk-react'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333',
    // Bricks no browser: aceita NEXT_PUBLIC_MP_PUBLIC_KEY ou MP_PUBLIC_KEY (mesmo .env da raiz que a API).
    NEXT_PUBLIC_MP_PUBLIC_KEY: mpPublicKey,
    NEXT_PUBLIC_MOCK_PAYMENT: process.env.NEXT_PUBLIC_MOCK_PAYMENT ?? 'false',
  },
};

export default nextConfig;
