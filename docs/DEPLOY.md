# Deploy — Flor de Menina

Guia para go-live em **VPS Hostinger + Coolify**, domínio **https://flordemenina.store**. O deploy automático não faz parte deste repositório: o operador (Murilo) executa os passos no painel Coolify e nos scripts documentados aqui.

## Pré-requisitos

- VPS (referência: Hostinger KVM 2, 8 GB RAM, 2 vCPU, datacenter BR).
- [Coolify](https://coolify.io/) instalado na VPS (ou stack Docker manual usando os arquivos deste repo).
- Domínio `flordemenina.store` com registro **A** apontando para o IP público da VPS.
- Contas e credenciais:
  - **Mercado Pago** (produção, CNPJ da loja) — `PAYMENT_PROVIDER=mercado_pago`, `MP_*`.
  - **Melhor Envio** (OAuth) — `SHIPPING_PROVIDER=melhor_envio`, `MELHOR_ENVIO_*`, `ENCRYPTION_KEY`.
  - **Resend** — domínio verificado, `MAIL_PROVIDER=resend`, `RESEND_*`.
  - **Cloudflare R2** — bucket, `R2_*` (a API usa `R2_ENDPOINT` no boot do `R2Service`).
  - **Google Cloud Console** — OAuth Web client, `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
- Repositório GitHub `linvex-software/flor-de-menina` com acesso de deploy (read + webhook).

## Variáveis de ambiente (visão geral)

| Área             | Onde configurar             | Observação                                                                         |
| ---------------- | --------------------------- | ---------------------------------------------------------------------------------- |
| API Nest         | Coolify → serviço API       | Validadas no boot com `parseEnv()` (`apps/api/src/config/env.schema.ts`).          |
| Web Next.js      | Coolify → serviço Web       | Públicas `NEXT_*` no build; `INTERNAL_API_URL` em runtime para health server-side. |
| Postgres / Redis | Compose ou serviços Coolify | `DATABASE_URL`, `REDIS_URL`.                                                       |

Lista detalhada: ver `.env.example` (desenvolvimento) e `.env.production.example` (modelo para produção). **Nunca** commitar `.env` ou `.env.production` com segredos reais.

### Web (Next.js)

- `NEXT_PUBLIC_API_URL` — URL pública da API (ex.: `https://api.flordemenina.store` ou mesmo domínio com reverse proxy).
- `NEXT_PUBLIC_SITE_URL` — URL canônica da loja (`https://flordemenina.store`).
- `INTERNAL_API_URL` (opcional mas recomendado no Docker) — URL que o **servidor** Next usa para chamar a API (ex.: `http://api:3333` no `docker-compose.production.yml`).

### API (NestJS)

- Obrigatórias: `DATABASE_URL`, `JWT_SECRET`, `JWT_CUSTOMER_SECRET`, `JWT_CUSTOMER_REFRESH_SECRET` (≥ 32 caracteres), `ENCRYPTION_KEY` (64 hex em produção ou com Melhor Envio), Redis (`REDIS_URL` ou `REDIS_HOST`/`REDIS_PORT`), `PAYMENT_PROVIDER`, `SHIPPING_PROVIDER`, `MAIL_PROVIDER`.
- Condicionais em produção: credenciais MP, ME, Resend, R2, Google — ver `env.schema.ts`.

## Primeiro deploy (Coolify — fluxo típico)

1. Criar projeto no Coolify e conectar o repositório GitHub.
2. Criar **dois** serviços (ou um stack Compose):
   - **API**: build a partir de `apps/api/Dockerfile`, porta interna **3333**, comando padrão `node apps/api/dist/main.js`.
   - **Web**: build a partir de `apps/web/Dockerfile`, porta **3000**, com args de build `NEXT_PUBLIC_API_URL` e `NEXT_PUBLIC_SITE_URL`.
3. Subir **Postgres 16** e **Redis 7** (AOF recomendado) como serviços gerenciados ou via `docker-compose.production.yml`.
4. Colar todas as variáveis de ambiente no painel (equivalente ao `.env.production`).
5. Após o primeiro deploy com containers saudáveis:
   1. Rodar migrations **apenas** com `migrate deploy` (nunca `migrate dev` em produção):

      ```bash
      bash scripts/migrate-prod.sh
      ```

      (Na VPS, com `DATABASE_URL` exportada ou via `docker exec` no container que tenha `pg_dump` + pnpm; ajuste `BACKUP_DIR` se necessário.)

   2. Rodar seed mínimo **uma vez**:

      ```bash
      pnpm db:seed:prod
      ```

      Requer `ADMIN_SEED_EMAIL` e `ADMIN_SEED_PASSWORD` no ambiente.

6. Configurar proxy reverso / domínio + HTTPS no Coolify (Let's Encrypt).
7. Smoke test:

   ```bash
   curl -fsS https://SEU_DOMINIO_API/health
   curl -fsS https://flordemenina.store/api/health
   ```

## Atualizações subsequentes

1. Merge na `main` com migrations Prisma já revisadas.
2. Deploy da nova imagem (API e/ou Web).
3. Na VPS: `pnpm --filter @flor/database db:migrate:deploy` (ou `scripts/migrate-prod.sh` com backup).
4. **Não** rodar `db:seed:prod` de novo salvo decisão operacional (script é idempotente para categorias/CMS, mas não sobrescreve admin existente).

## Backup e rollback

- **Backup**: `scripts/migrate-prod.sh` gera `pg_dump` em `/backups` (ou `BACKUP_DIR`) antes de `migrate deploy`.
- **Rollback de dados**: restaurar dump com `psql "$DATABASE_URL" < arquivo.sql`.
- **Rollback de código**: redeploy da imagem/tag anterior no Coolify. Schema: só “pra frente” com migrations novas; evitar `db push` destrutivo em produção.

## Health checks

- API: `GET /health` — Postgres + Redis, **503** se degradado.
- Web: `GET /api/health` — tenta `/health` na API (via `INTERNAL_API_URL` ou `NEXT_PUBLIC_API_URL`).

## Smoke local (Docker Compose produção)

```bash
cp .env.production.example .env.production
# Editar .env.production com valores válidos (R2, Resend, etc., ou manter mock onde fizer sentido)
bash scripts/smoke-deploy.sh
```

## Troubleshooting

| Sintoma                    | Verificação                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------ |
| API não sobe               | Logs do container; `parseEnv()` imprime erros Zod no stderr antes do Nest.           |
| 503 em `/health`           | Postgres ou Redis inacessível; conferir `DATABASE_URL` / `REDIS_URL` na rede Docker. |
| Web 503 em `/api/health`   | `INTERNAL_API_URL` incorreto dentro do stack; firewall entre serviços.               |
| Uploads / CMS imagem falha | `R2_*` incompletas; `R2_ENDPOINT` obrigatória no `R2Service`.                        |
| E-mails não saem           | `MAIL_PROVIDER=resend` + `RESEND_API_KEY`; fila BullMQ precisa de Redis estável.     |

## Referência de arquivos

- `apps/api/Dockerfile`, `apps/web/Dockerfile` — imagens multi-stage, usuário non-root, `HEALTHCHECK`.
- `docker-compose.production.yml` — stack de referência (Postgres, Redis, API, Web).
- `docs/spec-71-production-readiness.md` — especificação da task #71.
