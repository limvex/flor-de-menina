/**
 * Deve ser importado antes de qualquer módulo que use `@flor/database` (Prisma lê DATABASE_URL na importação).
 * Cobre `nest start --watch` e outros starts sem `node --env-file`.
 *
 * Em produção (Docker/Coolify) as variáveis vêm do ambiente — não carregamos `.env` nem o pacote `dotenv`.
 * Na imagem pnpm o `dotenv` não fica resolvível a partir de `apps/api/dist/` sem `apps/api/node_modules`;
 * evitar `require('dotenv')` em `NODE_ENV=production` remove o crash MODULE_NOT_FOUND.
 */
import { existsSync } from 'fs';
import { resolve } from 'path';

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { config } = require('dotenv') as typeof import('dotenv');

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
}
