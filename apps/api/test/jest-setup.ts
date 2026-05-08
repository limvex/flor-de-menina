// Carrega variáveis do .env raiz (DATABASE_URL etc.) antes de qualquer teste.
// Sem isso, specs que usam o `prisma` real recebem `Can't reach database server`.
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL não definido. Verifique o .env raiz (DATABASE_URL=postgresql://...).',
  );
}
