# Spec — Production Readiness (#71)

Objetivo: deixar o monorepo pronto para deploy manual (Coolify + Hostinger, tasks #70/#25), sem executar deploy neste PR.

## 1. Validação de variáveis de ambiente

API e Web validam env vars **no startup** usando `zod`. Em **produção**, a API **encerra o processo** se faltar var crítica ou combinação inválida.

### API (`apps/api/src/config/env.schema.ts`)

**Obrigatórias (todos os ambientes, com defaults seguros só onde indicado):**

- `DATABASE_URL`
- `JWT_SECRET` (≥ 32 caracteres)
- `JWT_CUSTOMER_SECRET` (≥ 32 caracteres)
- `JWT_CUSTOMER_REFRESH_SECRET` (≥ 32 caracteres) — já usada em `CustomerAuthService`
- `ENCRYPTION_KEY` (64 caracteres hex) quando `SHIPPING_PROVIDER=melhor_envio` ou em `NODE_ENV=production`
- `NODE_ENV` (`production` | `development` | `test`)
- `PORT` ou `API_PORT` (porta HTTP da API; default 3333)
- `REDIS_URL` **ou** o trio `REDIS_HOST` + `REDIS_PORT` + `REDIS_PASSWORD` (opcional) — BullMQ continua funcionando; `REDIS_URL` tem precedência quando definida
- `PAYMENT_PROVIDER` (`mock` | `mercado_pago`)
- `SHIPPING_PROVIDER` (`mock` | `melhor_envio`) — alinhado ao uso em código / settings
- `MAIL_PROVIDER` (`maildev` | `resend`)

**Condicionais em produção:**

- `PAYMENT_PROVIDER=mercado_pago` → `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`
- `SHIPPING_PROVIDER=melhor_envio` → `MELHOR_ENVIO_CLIENT_ID`, `MELHOR_ENVIO_CLIENT_SECRET`
- `MAIL_PROVIDER=resend` → `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (e demais vars já usadas pelo `ResendAdapter`)
- R2 (uploads / CMS imagens): `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` obrigatórios em produção (`R2Service` usa `R2_ENDPOINT`, não só account id)
- Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` obrigatórios em produção (login cliente/admin social conforme app)

**Opcionais:**

- `WHATSAPP_SUPPORT_URL`, `INSTAGRAM_URL`, `OPENROUTER_API_KEY`, etc.

**Comportamento:**

- `parseEnv()` importado em `main.ts` **depois** de `./load-env` e **antes** de `NestFactory.create`
- Erro Zod ou validação condicional: mensagens claras em `stderr` + `process.exit(1)`
- Em `development`: não exigir `ENCRYPTION_KEY` se `SHIPPING_PROVIDER=mock`; avisos (`console.warn`) para gaps não bloqueantes

### Web (`apps/web/src/lib/env.ts`)

- **Cliente:** `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL` (URLs válidas); `NEXT_PUBLIC_MP_PUBLIC_KEY`, `NEXT_PUBLIC_GA_ID` opcionais
- **Servidor:** `INTERNAL_API_URL` opcional (fetch server-side para `/health` da API dentro da rede Docker, ex.: `http://api:3333`); `COOKIE_DOMAIN` opcional

## 2. Health checks

### `GET /health` (API)

- JSON: `status` (`ok` se DB+Redis OK, senão `degraded`), `timestamp`, `version` (de `package.json` / env), `uptime`, `checks.database`, `checks.redis` (`ok` ou mensagem de erro)
- **503** se qualquer check obrigatório falhar
- DB: `prisma.$queryRaw\`SELECT 1\``com timeout 2s (singleton`prisma`de`@flor/database`)
- Redis: `PING` via `ioredis` com timeout 1s
- Rota **pública**, sem JWT; `@SkipThrottle()` para não estourar rate limit

### `GET /api/health` (Web)

- JSON: `status`, `timestamp`, `version`, `apiReachable`
- Fetch `INTERNAL_API_URL` ou `NEXT_PUBLIC_API_URL` + `/health`, timeout 3s
- **503** se API inacessível

## 3. Logs estruturados (API)

- `nestjs-pino` + `pino-http`: **JSON** em produção, **pino-pretty** em desenvolvimento
- `requestId`: header `x-request-id` ou UUID gerado
- Campos úteis: método, URL, status, duração, `requestId`, `userId` quando disponível no request
- Rotas sensíveis (nunca logar body detalhado / tratar como redacted): prefixos que contêm `/auth/`, `/payments/process`, `/webhooks/`, `/admin/users`

## 4. Seed de produção

- Arquivo: `packages/database/prisma/seed.production.ts`
- Idempotente: `upsert` / updates vazios onde aplicável
- Conteúdo: admin master (`ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD`), categorias raiz (slug único composto `parentId` + `slug`), `HomePageContent` singleton, `StoreSettings` singleton (ex.: frete grátis global R$ 300 — sem sobrescrever em re-run se já ajustado manualmente, usar `update: {}` após garantir linha inicial)
- **Não** cria produtos, pedidos nem clientes fake
- Script raiz: `"db:seed:prod": "tsx packages/database/prisma/seed.production.ts"`

## 5. Migration em produção

- `scripts/migrate-prod.sh`: valida `DATABASE_URL`, backup `pg_dump`, `pnpm --filter @flor/database prisma migrate deploy`, `prisma migrate status`
- Em erro: mensagens de restore manual; sem rollback automático de schema

## 6. Docker

- `apps/api/Dockerfile`: multi-stage, Alpine, usuário não-root (uid 1001), `HEALTHCHECK` em `:3333/health`
- `apps/web/Dockerfile`: `output: 'standalone'`, multi-stage, non-root, `HEALTHCHECK` em `:3000/api/health`
- `docker-compose.production.yml`: Postgres, Redis (AOF), API, Web; volumes; limites de memória; logging `json-file` com rotação; **sem** Maildev; portas publicadas para smoke local

## 7. Documentação

- `docs/DEPLOY.md`: pré-requisitos, Coolify, variáveis, primeiro deploy, updates, backup/rollback, troubleshooting
- Atualizar `.env.example` com vars novas (`REDIS_URL`, `NEXT_PUBLIC_SITE_URL`, `INTERNAL_API_URL`, seeds admin, `LOG_LEVEL`, etc.)

## 8. Smoke deploy local

- `scripts/smoke-deploy.sh`: build compose produção, `up`, health checks, tear down; requer `.env.production` válido (ou documentado fluxo de cópia a partir do `.env` local)

## 9. CI

- Manter lint, typecheck, build; cache pnpm
- Job opcional `smoke-compose` com `continue-on-error: true` (ex.: validar `docker compose … config` ou smoke completo se viável)

## Referências de domínio

- Loja: `https://flordemenina.store` (não usar domínio legado em docs novos)
