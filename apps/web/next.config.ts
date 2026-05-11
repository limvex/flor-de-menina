import { resolve } from 'path';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';

// Carrega `.env` da raiz do monorepo (mesmo arquivo que a API Nest usa).
const monorepoRoot = resolve(__dirname, '../..');
loadEnvConfig(monorepoRoot, process.env.NODE_ENV !== 'production');

/** Garante que variáveis públicas entrem no bundle do cliente (Turbopack/monorepo). */
const nextConfig: NextConfig = {
  transpilePackages: ['@mercadopago/sdk-react'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333',
    NEXT_PUBLIC_MP_PUBLIC_KEY: process.env.NEXT_PUBLIC_MP_PUBLIC_KEY ?? '',
    NEXT_PUBLIC_MOCK_PAYMENT: process.env.NEXT_PUBLIC_MOCK_PAYMENT ?? 'false',
  },
};

export default nextConfig;
