#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_FILE="$BACKUP_DIR/before-migration-$TIMESTAMP.sql"

echo "🔒 Script de migration em produção"
echo "Timestamp: $TIMESTAMP"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL não definida"
  exit 1
fi

if [ "${NODE_ENV:-}" != "production" ]; then
  echo "⚠️ NODE_ENV != production. Confirma?"
  read -r -p "Digite 'sim' para continuar: " confirm
  if [ "$confirm" != "sim" ]; then
    exit 0
  fi
fi

mkdir -p "$BACKUP_DIR"
echo "📦 Backup em $BACKUP_FILE..."
pg_dump "$DATABASE_URL" >"$BACKUP_FILE"
echo "✅ Backup OK ($(du -h "$BACKUP_FILE" | cut -f1))"

echo "🚀 Aplicando migrations..."
pnpm --filter @flor/database db:migrate:deploy

echo "🔍 Verificando status..."
pnpm --filter @flor/database exec prisma migrate status --schema prisma/schema.prisma

echo "✅ Migration concluída"
echo ""
echo "Em caso de problema, restore manual (exemplo):"
echo "  psql \"\$DATABASE_URL\" < $BACKUP_FILE"
