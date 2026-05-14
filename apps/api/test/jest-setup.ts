// Carrega variáveis do .env raiz (DATABASE_URL etc.) antes de qualquer teste.
// Sem isso, specs que usam o `prisma` real recebem `Can't reach database server`.
import * as dotenv from 'dotenv';
import * as path from 'path';
import { parseEnv } from '../src/config/env.schema';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL não definido. Verifique o .env raiz (DATABASE_URL=postgresql://...).',
  );
}

/** Garante mínimos exigidos por `parseEnv` sem sobrescrever valores já válidos no .env */
function ensureEnvForTests() {
  const pad = (key: string, minLen: number, fallback: string) => {
    const cur = process.env[key] ?? '';
    if (cur.length < minLen) process.env[key] = fallback;
  };
  pad('JWT_SECRET', 32, 'jest-jwt-secret-32-chars-minimum______');
  pad('JWT_CUSTOMER_SECRET', 32, 'jest-customer-secret-32-chars-min___');
  pad(
    'JWT_CUSTOMER_REFRESH_SECRET',
    32,
    'jest-customer-refresh-32-chars-min__',
  );
  const hex64 = /^[a-f0-9]{64}$/i;
  if (!process.env.ENCRYPTION_KEY || !hex64.test(process.env.ENCRYPTION_KEY)) {
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  }
  if (!process.env.REDIS_URL?.trim() && !process.env.REDIS_HOST?.trim()) {
    process.env.REDIS_HOST = 'localhost';
    process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
  }
}

ensureEnvForTests();

// Valida env como em produção/dev (AppModule + Bull usam as mesmas regras).
parseEnv();
