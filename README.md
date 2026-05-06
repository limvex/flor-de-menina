# Flor de Menina — E-commerce

E-commerce de moda da Flor de Menina (Maceió-AL). Desenvolvido pela Limvex.

## Stack
- **Frontend:** Next.js 15 (App Router) + Tailwind CSS + React Query
- **Backend:** NestJS 10 + Prisma + PostgreSQL
- **Monorepo:** Turborepo + pnpm workspaces
- **Deploy:** Hostinger VPS + Coolify (produção) / Vercel + Railway (desenvolvimento)

## Estrutura
```
apps/
  web/        → Next.js (loja pública + admin em /admin)
  api/        → NestJS (REST API)
packages/
  database/   → Prisma schema + client compartilhado
  types/      → Tipos TS + Zod schemas
  ui/         → Componentes React compartilhados
```

## Setup local

```bash
# Pré-requisitos: Node 20+, pnpm 9+, Docker
pnpm install
docker compose up -d
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Web: http://localhost:3000  
API: http://localhost:3333  
Admin: http://localhost:3000/admin

## Documentação
- [PROJECT.md](./docs/PROJECT.md) — Padrões e arquitetura
- [CONTRIBUTING.md](./docs/CONTRIBUTING.md) — Fluxo de desenvolvimento
- [DEPLOY.md](./docs/DEPLOY.md) — Deploy e infraestrutura
- [SCOPE.md](./docs/SCOPE.md) — Escopo travado do projeto
