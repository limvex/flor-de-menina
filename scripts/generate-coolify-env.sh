#!/usr/bin/env bash
# Gera um .env completo para colar no Coolify (Docker Compose + docker-compose.production.yml).
# Base: .env.example + .env.production.example + variáveis usadas pela API/Web em produção.
#
# Uso:
#   bash scripts/generate-coolify-env.sh > ~/coolify-flor.env
#   # ou: pnpm deploy:coolify-env > ~/coolify-flor.env
#
# Depois: preencha R2, Resend, Google e (quando for a hora) Mercado Pago produção.
# NÃO commite o arquivo gerado.

set -euo pipefail

PG_USER="flor"
PG_PASS="$(openssl rand -hex 16)"
PG_DB="flor_de_menina"
JWT_SECRET="$(openssl rand -hex 32)"
JWT_CUSTOMER_SECRET="$(openssl rand -hex 32)"
JWT_CUSTOMER_REFRESH_SECRET="$(openssl rand -hex 32)"
ENCRYPTION_KEY="$(openssl rand -hex 32)"
ADMIN_SEED_PASSWORD="$(openssl rand -base64 24 | tr -d '\n' | tr '/+' 'Aa')"

cat <<EOF
# =============================================================================
# Gerado em $(date -u +"%Y-%m-%dT%H:%M:%SZ") — não commitar este arquivo.
# Coolify → recurso Docker Compose → Production Environment Variables (colar tudo)
# =============================================================================

# --- Postgres (serviço compose: postgres) ---
POSTGRES_USER=${PG_USER}
POSTGRES_PASSWORD=${PG_PASS}
POSTGRES_DB=${PG_DB}
DATABASE_URL=postgresql://${PG_USER}:${PG_PASS}@postgres:5432/${PG_DB}

# --- Redis (serviço compose: redis) — preferir REDIS_URL no Docker ---
REDIS_URL=redis://redis:6379
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=

# --- API ---
NODE_ENV=production
PORT=3333
API_PORT=3333
LOG_LEVEL=info

# --- JWT admin (>= 32 caracteres) ---
JWT_SECRET=${JWT_SECRET}

# --- JWT cliente (>= 32 caracteres) ---
JWT_CUSTOMER_SECRET=${JWT_CUSTOMER_SECRET}
JWT_CUSTOMER_REFRESH_SECRET=${JWT_CUSTOMER_REFRESH_SECRET}
JWT_CUSTOMER_EXPIRES_IN=15m
JWT_CUSTOMER_REFRESH_EXPIRES_IN=30d

# --- Criptografia OAuth / tokens (64 hex em produção) ---
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# --- Provedores core ---
PAYMENT_PROVIDER=mock
SHIPPING_PROVIDER=mock
MAIL_PROVIDER=resend

# --- Mercado Pago (cole produção quando tiver webhook + chaves) ---
MP_ACCESS_TOKEN=
MP_PUBLIC_KEY=
MP_WEBHOOK_SECRET=
MP_NOTIFICATION_URL=https://api.flordemenina.store/webhooks/mercado-pago
NEXT_PUBLIC_MP_PUBLIC_KEY=
NEXT_PUBLIC_MOCK_PAYMENT=true
# Nunca true em produção com MP real
ALLOW_WEBHOOK_WITHOUT_SECRET=false

# --- Mock de pagamento (só enquanto PAYMENT_PROVIDER=mock) ---
MOCK_WEBHOOK_PIX_DELAY_MS=8000
MOCK_WEBHOOK_CARD_DELAY_MS=2000
MOCK_PIX_APPROVAL_RATE=0.9
MOCK_CARD_APPROVAL_RATE=0.8

# --- Melhor Envio ---
MELHOR_ENVIO_CLIENT_ID=
MELHOR_ENVIO_CLIENT_SECRET=
MELHOR_ENVIO_REDIRECT_URI=https://api.flordemenina.store/admin/shipping/me/callback
MELHOR_ENVIO_BASE_URL=https://www.melhorenvio.com.br

# --- Resend (obrigatório com MAIL_PROVIDER=resend) ---
RESEND_API_KEY=
RESEND_FROM_EMAIL="Flor de Menina <contato@flordemenina.store>"
RESEND_REPLY_TO=contato@flordemenina.store
MAIL_FROM_EMAIL=contato@flordemenina.store
MAIL_FROM_NAME=Flor de Menina

# --- Cloudflare R2 (obrigatório em produção na API) ---
R2_ACCOUNT_ID=
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=flor-de-menina-prod
R2_PUBLIC_URL=

# --- Google OAuth (obrigatório em produção) ---
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://flordemenina.store/auth/google/callback
NEXT_PUBLIC_MOCK_GOOGLE_OAUTH=false
MOCK_GOOGLE_OAUTH=false

# --- OpenRouter (opcional) ---
OPENROUTER_API_KEY=
OPENROUTER_MODEL=anthropic/claude-haiku-4.5
MOCK_AI_DESCRIPTION=

# --- URLs públicas (Next + e-mails) ---
NEXT_PUBLIC_API_URL=https://api.flordemenina.store
NEXT_PUBLIC_SITE_URL=https://flordemenina.store
WEB_URL=https://flordemenina.store
FRONTEND_URL=https://flordemenina.store
APP_URL=https://flordemenina.store

# --- Next server → API no Docker (mesmo valor que o compose usa no serviço web) ---
INTERNAL_API_URL=http://api:3333
COOKIE_DOMAIN=.flordemenina.store

# --- Analytics (opcional) ---
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_META_PIXEL_ID=

# --- Links rodapé e-mails (opcional) ---
WHATSAPP_SUPPORT_URL=
INSTAGRAM_URL=https://instagram.com/flordemeninaoficial

# --- Convite de review por e-mail ---
REVIEW_INVITATION_DELAY_DAYS=7

# --- Seed admin (uma vez: pnpm db:seed:prod) ---
ADMIN_SEED_EMAIL=admin@flordemenina.store
ADMIN_SEED_PASSWORD=${ADMIN_SEED_PASSWORD}

# --- Só para testes E2E locais (deixe vazio em produção) ---
ADMIN_TEST_EMAIL=
ADMIN_TEST_PASSWORD=
EOF

echo "" >&2
echo ">>> Guarde no Bitwarden — senha do primeiro admin (/admin/login):" >&2
echo "    ADMIN_SEED_PASSWORD=${ADMIN_SEED_PASSWORD}" >&2
echo "" >&2
