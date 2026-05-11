/**
 * Deve ser importado antes de qualquer módulo que use `@flor/database` (Prisma lê DATABASE_URL na importação).
 * Cobre `nest start --watch` e outros starts sem `node --env-file`.
 */
import { existsSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

const candidates = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../../.env'),
  resolve(__dirname, '../../.env'),
];

for (const envPath of candidates) {
  if (existsSync(envPath)) {
    config({ path: envPath, override: false });
    break;
  }
}
