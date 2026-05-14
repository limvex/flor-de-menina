# Flor de Menina — E-commerce

[![CI](https://github.com/linvex-software/flor-de-menina/actions/workflows/ci.yml/badge.svg)](https://github.com/linvex-software/flor-de-menina/actions/workflows/ci.yml)

E-commerce de moda da Flor de Menina (Maceió-AL). Desenvolvido pela [Limvex](https://limvex.com).

## Stack

- **Frontend:** Next.js 16 (App Router) + Tailwind CSS v4 + shadcn/ui + React Query
- **Backend:** NestJS 10 + Prisma + PostgreSQL
- **Monorepo:** Turborepo + pnpm workspaces
- **Deploy:** Hostinger VPS + Coolify (produção) — sem deploy de desenvolvimento

## Estrutura

```
flor-de-menina/
├── apps/
│   ├── web/          → Next.js 16 (loja pública + /admin)
│   └── api/          → NestJS 10 (REST API, porta 3333)
├── packages/
│   ├── database/     → Prisma schema + client compartilhado
│   ├── types/        → Tipos TS + Zod schemas
│   └── ui/           → Componentes React compartilhados
├── docs/             → Documentação do projeto
└── docker-compose.yml
```

## Pré-requisitos

- [Node.js](https://nodejs.org/) >= 20.0.0
- [pnpm](https://pnpm.io/) >= 9.0.0 (`corepack enable && corepack prepare pnpm@9 --activate`)
- [Docker](https://www.docker.com/) + Docker Compose (para o banco PostgreSQL)

## Setup local

```bash
# 1. Clonar o repositório
git clone git@github.com:linvex-software/flor-de-menina.git
cd flor-de-menina

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações locais

# 4. Subir o banco de dados
docker compose up -d

# 5. Rodar migrations e seed
pnpm db:migrate
pnpm db:seed

# 6. Iniciar em modo desenvolvimento
pnpm dev
```

## URLs locais

| Serviço      | URL                         |
| ------------ | --------------------------- |
| Loja pública | http://localhost:3000       |
| Painel admin | http://localhost:3000/admin |
| API NestJS   | http://localhost:3333       |

## Comandos úteis

```bash
pnpm dev           # Inicia todos os apps em modo dev (via Turborepo)
pnpm build         # Build de produção
pnpm lint          # Lint em todos os pacotes
pnpm typecheck     # Type-check em todos os pacotes
pnpm format        # Formata todos os arquivos com Prettier

pnpm db:migrate    # Roda migrations do Prisma (dev)
pnpm db:migrate:deploy  # deploy de migrations (produção / CI)
pnpm db:studio     # Abre Prisma Studio (visualizar banco)
pnpm db:seed       # Popula banco com dados iniciais (dev)
pnpm db:seed:prod  # Seed mínimo de produção (admin + categorias) — ver `.env.example`

# Backup + migrate em produção (na VPS, com DATABASE_URL)
bash scripts/migrate-prod.sh
```

## Variáveis de ambiente

Consulte o arquivo `.env.example` para a lista completa de variáveis necessárias.

**Nunca commite o `.env`** — apenas o `.env.example` vai para o repositório.

## Documentação

- [PROJECT.md](./docs/PROJECT.md) — Padrões e arquitetura
- [CONTRIBUTING.md](./docs/CONTRIBUTING.md) — Fluxo de desenvolvimento
- [DEPLOY.md](./docs/DEPLOY.md) — Deploy e infraestrutura
- [SCOPE.md](./docs/SCOPE.md) — Escopo travado do projeto

## Contexto do projeto

Leia o [CLAUDE.md](./CLAUDE.md) para o contexto completo do projeto, decisões arquiteturais e status das tasks.
