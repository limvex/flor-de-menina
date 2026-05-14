# Primeiro deploy no Coolify (Flor de Menina)

Você **não** deve usar **Nixpacks** com um único serviço na porta 3000: o monorepo precisa de **Postgres + Redis + API + Web**. O arquivo `docker-compose.production.yml` na raiz já define isso.

## 1) Corrigir o recurso que você criou (Nixpacks)

**Opção A — mudar o Build Pack (se o Coolify permitir)**

No recurso `flor-de-menina:main-...` → **Configuration** → **General**:

- **Build Pack:** troque de **Nixpacks** para **Docker Compose**
- **Base Directory:** `/` (raiz do repo)
- **Docker Compose Location:** `docker-compose.production.yml`
- Salve.

**Opção B — apagar e recriar (se não der para trocar o pack)**

**Danger Zone** → remover aplicação → **+ Add Resource** → **Private Repository (GitHub App)** → no passo em que aparece **Branch** e **Build Pack**, escolha **Docker Compose** (não Nixpacks) antes de **Continue**.

## 2) Gerar o `.env` completo para colar no Coolify

O script inclui **tudo** que costuma ir no `.env` da raiz para produção no Compose (Postgres, Redis, JWT, MP, ME, Resend, R2, Google, OpenRouter, URLs, mock de pagamento, seed admin, etc.). **Segredos fortes** (Postgres, JWT, `ENCRYPTION_KEY`, senha do seed) são gerados na hora.

No **seu Fedora** (na pasta do repo):

```bash
cd ~/Documents/workspace/limvex/flor-de-menina
pnpm deploy:coolify-env > ~/coolify-flor.env
# ou: bash scripts/generate-coolify-env.sh > ~/coolify-flor.env
```

Abra `~/coolify-flor.env` e preencha **manualmente** (Bitwarden):

- **R2** (`R2_*`)
- **Resend** (`RESEND_API_KEY`, etc.)
- **Google** (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`)

Quando for ativar **Mercado Pago produção**:

- `PAYMENT_PROVIDER=mercado_pago`
- `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`, `NEXT_PUBLIC_MP_PUBLIC_KEY`
- `NEXT_PUBLIC_MOCK_PAYMENT=false`
- Webhook no painel do MP apontando para `MP_NOTIFICATION_URL`

Enquanto isso, deixe **`PAYMENT_PROVIDER=mock`** e **`NEXT_PUBLIC_MOCK_PAYMENT=true`** para validar o deploy.

No Coolify → recurso do **Compose** → **Environment Variables** → área **Production**: cole **todo** o conteúdo do arquivo (uma variável por linha, formato `CHAVE=valor`) → **Save All Environment Variables**.

O Compose usa `env_file: .env.production`: no Coolify isso costuma ser preenchido pelo painel de variáveis do recurso (mesmo conteúdo).

## 3) Domínios (Configuration → Domains / FQDN)

Associe:

| Domínio                  | Serviço Compose | Porta |
| ------------------------ | --------------- | ----- |
| `flordemenina.store`     | `web`           | 3000  |
| `www.flordemenina.store` | `web`           | 3000  |
| `api.flordemenina.store` | `api`           | 3333  |

(Os nomes exatos dos serviços são `web`, `api`, `postgres`, `redis` — iguais ao `docker-compose.production.yml`.)

## 4) Deploy

**Deploy** e acompanhe **Logs**. O primeiro build pode levar vários minutos.

## 5) Migrations e seed (uma vez)

Quando os containers estiverem de pé, use o **Terminal** do Coolify no serviço **api** (ou `docker exec` na VPS):

```bash
pnpm db:migrate:deploy
pnpm db:seed:prod
```

O script gerou e imprimiu no terminal a **`ADMIN_SEED_PASSWORD`** — use com `ADMIN_SEED_EMAIL` para o primeiro login em `/admin/login`.

## 6) Smoke

```bash
curl -fsS https://api.flordemenina.store/health
curl -fsS https://flordemenina.store/api/health
```

## Referência

- Modelo estático (sem segredos gerados): `.env.production.example`
- Script com segredos gerados: `scripts/generate-coolify-env.sh`
- Stack: `docker-compose.production.yml`
