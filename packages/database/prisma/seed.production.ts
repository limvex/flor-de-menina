/**
 * Seed mínimo para produção (idempotente).
 * Uso: `pnpm db:seed:prod` com `ADMIN_SEED_EMAIL` e `ADMIN_SEED_PASSWORD` definidos.
 */
import { config as loadRootEnv } from 'dotenv';
import { resolve } from 'path';

loadRootEnv({ path: resolve(__dirname, '../../../.env') });

import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, UserRole } from '../src/generated/prisma';
import { Pool } from 'pg';
import { createId } from '@paralleldrive/cuid2';
import bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const CATEGORIES: { slug: string; name: string; sortOrder: number }[] = [
  { slug: 'vestidos', name: 'Vestidos', sortOrder: 1 },
  { slug: 'blusas', name: 'Blusas', sortOrder: 2 },
  { slug: 'calcas', name: 'Calças', sortOrder: 3 },
  { slug: 'bolsas', name: 'Bolsas', sortOrder: 4 },
  { slug: 'acessorios', name: 'Acessórios', sortOrder: 5 },
];

async function main() {
  console.log('🌱 Iniciando seed de produção (idempotente)...');

  const adminEmail = process.env.ADMIN_SEED_EMAIL;
  const adminPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error(
      '❌ ADMIN_SEED_EMAIL e ADMIN_SEED_PASSWORD são obrigatórios para o seed de produção.',
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      id: createId(),
      email: adminEmail,
      name: 'Admin Master',
      passwordHash,
      role: UserRole.ADMIN,
      emailVerified: true,
      isActive: true,
      mustChangePassword: true,
    },
    update: {},
  });
  console.log('✅ Admin master garantido');

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { parentId_slug: { parentId: null, slug: cat.slug } },
      create: {
        id: createId(),
        slug: cat.slug,
        name: cat.name,
        sortOrder: cat.sortOrder,
        isActive: false,
        parentId: null,
      },
      update: {},
    });
  }
  console.log('✅ Categorias essenciais garantidas');

  await prisma.homePageContent.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      bannerTitle: 'Flor de Menina',
      bannerSubtitle: 'Moda feminina atemporal',
      bannerButtonText: 'Ver coleção',
      bannerButtonUrl: '/produtos',
      aboutTitle: 'Sobre nós',
      aboutText: 'Loja em Maceió com 13 anos de história.',
    },
    update: {},
  });
  console.log('✅ HomePageContent default garantido');

  await prisma.storeSettings.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      freeShippingGlobalThreshold: new Prisma.Decimal(300),
      shippingProvider: 'mock',
    },
    update: {},
  });
  console.log('✅ StoreSettings singleton garantido');

  console.log('✅ Seed de produção concluído');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
