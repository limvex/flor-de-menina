# Padrões do Projeto — Flor de Menina

## Arquitetura

Monorepo com 2 apps e 3 packages compartilhados.

### apps/web (Next.js 15 — App Router)
- Loja pública em `/` (catálogo, PDP, carrinho, checkout, conta)
- Painel admin em `/admin` (CRUD, dashboard, estoque, pedidos)
- Server Components por padrão; Client Components só onde necessário
- Mutations via Server Actions ou React Query → API NestJS
- Autenticação via cookies HTTP-only

### apps/api (NestJS 10)
- REST API em `:3333`
- Módulos: auth, users, products, categories, orders, payments, shipping, reviews, coupons, uploads, ai
- Guards JWT pra rotas autenticadas, RolesGuard pra admin
- Validação com class-validator + Zod onde fizer sentido
- Webhooks isolados em módulo próprio com idempotência

### packages/database
- Prisma schema único (single source of truth)
- Client exportado pra ser usado por web e api
- Migrations versionadas, seed de dados iniciais

### packages/types
- Tipos TS compartilhados
- Zod schemas usados em API e Web (validação de form, response, etc)

### packages/ui
- Componentes React compartilhados (Button, Input, Modal, etc)
- Tailwind + Radix UI primitives
- shadcn/ui style

## Tema visual
- Estilo: minimalista, inspirado em Mirak (mirak.com.br)
- Paleta: marrom/bege/dourado (extraída da logo da Flor de Menina)
- Tipografia: serif elegante (títulos) + sans clean (corpo)
- Mobile-first (80%+ do tráfego virá de Instagram → mobile)

## Convenções de código
- TypeScript strict em todo o projeto
- Imports absolutos via tsconfig paths (`@/`, `@flor/database`, `@flor/types`, `@flor/ui`)
- Nomes em inglês no código, comentários e UI em português
- Commits em português, conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`)
- Branches: `feat/NN-nome-curto`, `fix/NN-nome-curto`, `chore/NN-nome-curto`
- PRs precisam: build passing, typecheck passing, lint passing

## Banco de dados
- PostgreSQL 16
- Prisma como ORM
- Soft delete onde fizer sentido (produtos, categorias)
- Timestamps automáticos (`createdAt`, `updatedAt`)
- IDs CUID2

## Segurança
- Senhas com bcrypt (cost 12)
- JWT em cookie HTTP-only, secure, sameSite=lax
- Rate limit nas rotas públicas (login, cadastro, checkout)
- CORS restrito ao domínio do front
- Validação rigorosa de inputs em toda rota

## Mock mode
- Variáveis `MOCK_PAYMENT=true` e `MOCK_SHIPPING=true` ativam mocks funcionais
- Mocks devem simular fluxo real (delay, sucesso/erro, webhook)
- Permite desenvolvimento e testes sem credenciais de produção
