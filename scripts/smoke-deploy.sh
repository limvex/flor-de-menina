#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "🧪 Smoke deploy local (docker-compose.production.yml)..."

if [ ! -f .env.production ]; then
  if [ -f .env.production.example ]; then
    echo "📋 Copiando .env.production.example → .env.production (revise os valores antes de produção real)."
    cp .env.production.example .env.production
  else
    echo "❌ Arquivo .env.production não encontrado e não há .env.production.example."
    exit 1
  fi
fi

echo "🔨 Build das imagens..."
docker compose --env-file .env.production -f docker-compose.production.yml build

echo "🚀 Subindo stack..."
docker compose --env-file .env.production -f docker-compose.production.yml up -d

echo "⏳ Aguardando serviços..."
sleep 35

echo "Testando GET /health da API..."
curl -fsS "http://127.0.0.1:3333/health" | head -c 2000
echo ""

echo "Testando GET /api/health da Web..."
curl -fsS "http://127.0.0.1:3000/api/health" | head -c 2000
echo ""

echo "Testando home da loja..."
curl -fsS -o /dev/null -w "Home: %{http_code}\n" "http://127.0.0.1:3000/"

echo "Encerrando stack..."
docker compose --env-file .env.production -f docker-compose.production.yml down

echo "✅ Smoke deploy concluído"
