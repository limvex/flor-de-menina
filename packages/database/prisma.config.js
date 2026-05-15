'use strict';
// Usado pelo runtime Docker (sem tsx). Exporta objeto puro — sem require('prisma/config')
// porque o subpath export não resolve corretamente nos bundles pnpm deploy.
// defineConfig() é uma função identidade, o objeto nu é aceito pelo Prisma 7.
// Local dev usa prisma.config.ts (prioridade sobre .js quando ambos existem).
module.exports = {
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
};
