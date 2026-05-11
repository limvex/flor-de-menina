/**
 * Carrega o `.env` na raiz do monorepo e executa o binário do Prisma.
 * Uso: node scripts/run-with-root-env.cjs migrate deploy
 */
const path = require('path');
const { spawnSync } = require('child_process');

require('dotenv').config({
  path: path.resolve(__dirname, '../../../.env'),
});

const prismaBin = path.join(__dirname, '../node_modules/.bin/prisma');
const args = process.argv.slice(2);
const r = spawnSync(prismaBin, args, {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  env: process.env,
});
process.exit(r.status === null ? 1 : r.status);
