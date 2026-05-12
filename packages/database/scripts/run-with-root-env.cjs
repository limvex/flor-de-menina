/**
 * Carrega o `.env` na raiz do monorepo e executa o binário do Prisma.
 * Uso: node scripts/run-with-root-env.cjs migrate deploy
 */
const path = require('path');
const { spawnSync } = require('child_process');

require('dotenv').config({
  path: path.resolve(__dirname, '../../../.env'),
});

/** No Windows, `node_modules/.bin/prisma` costuma ser um shell script — `spawnSync` direto falha (exit 1 sem log). */
let prismaCli;
try {
  prismaCli = path.join(path.dirname(require.resolve('prisma/package.json')), 'build/index.js');
} catch {
  prismaCli = path.join(__dirname, '../node_modules/prisma/build/index.js');
}

const args = process.argv.slice(2);
const r = spawnSync(process.execPath, [prismaCli, ...args], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
  env: process.env,
});
process.exit(r.status === null ? 1 : r.status);
