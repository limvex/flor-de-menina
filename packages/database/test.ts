import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { UserRole } from '../src/generated/prisma';
import { createId } from '@paralleldrive/cuid2';
import bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function test() {
  console.log('Testing Category table...');
  try {
    const categories = await prisma.category.findMany();
    console.log('Categories:', categories);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
