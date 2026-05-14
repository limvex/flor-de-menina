const { readFileSync } = require('fs');
const { resolve } = require('path');

try {
  const content = readFileSync(resolve(__dirname, '../../../.env'), 'utf8');
  for (const raw of content.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx < 1) continue;
    const key = line.slice(0, idx).trim();
    const val = line
      .slice(idx + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
    if (key && !process.env[key]) process.env[key] = val;
  }
} catch {}

function padEnv(key, minLen, fallback) {
  const cur = process.env[key] || '';
  if (cur.length < minLen) process.env[key] = fallback;
}

padEnv('JWT_SECRET', 32, 'e2e-jwt-secret-32-chars-minimum________');
padEnv('JWT_CUSTOMER_SECRET', 32, 'e2e-customer-secret-32-chars-min___');
padEnv(
  'JWT_CUSTOMER_REFRESH_SECRET',
  32,
  'e2e-customer-refresh-32-chars-min__',
);
if (!/^[a-f0-9]{64}$/i.test(process.env.ENCRYPTION_KEY || '')) {
  process.env.ENCRYPTION_KEY = 'a'.repeat(64);
}
if (!process.env.REDIS_URL?.trim() && !process.env.REDIS_HOST?.trim()) {
  process.env.REDIS_HOST = 'localhost';
  process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
}
