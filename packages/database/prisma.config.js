'use strict';
// CommonJS version of prisma.config — used in Docker runtime (no tsx available).
// Local dev uses prisma.config.ts (Prisma prefers .ts when both exist).
const { defineConfig } = require('prisma/config');

module.exports = defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env['DATABASE_URL'],
  },
});
