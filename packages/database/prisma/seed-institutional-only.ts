/**
 * Apenas páginas institucionais — importa `institutional-pages-seed.ts` e faz upsert no Postgres.
 *
 * Uso (em packages/database): pnpm db:seed:institutional
 */
import { config as loadRootEnv } from 'dotenv';
import { resolve } from 'path';

loadRootEnv({ path: resolve(__dirname, '../../../.env') });

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { createId } from '@paralleldrive/cuid2';
import { INSTITUTIONAL_PAGES_SEED } from './institutional-pages-seed';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('📄 Seed apenas páginas institucionais…');
  for (const pg of INSTITUTIONAL_PAGES_SEED) {
    await prisma.institutionalPage.upsert({
      where: { slug: pg.slug },
      create: {
        id: createId(),
        slug: pg.slug,
        title: pg.title,
        content: pg.content,
        sortOrder: pg.sortOrder,
        isActive: true,
      },
      update: {
        title: pg.title,
        content: pg.content,
        sortOrder: pg.sortOrder,
      },
    });
  }
  console.log(`✅ ${INSTITUTIONAL_PAGES_SEED.length} páginas (upsert por slug).`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
