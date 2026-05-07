# CLAUDE.md — Contexto do projeto Flor de Menina

> Este arquivo é o contexto persistente que **toda sessão do Claude Code DEVE LER ANTES** de começar qualquer trabalho. Atualize este arquivo ao final de cada task concluída.

## 📋 Sobre o projeto

**Cliente:** Flor de Menina (loja de moda física em Maceió-AL, 13 anos, 293k seguidores Instagram, dona Daniela Costa)
**Empresa executora:** Limvex (limvex.com)
**Repo:** `linvex-software/flor-de-menina`
**Domínio:** `flordemenina.site`

## 🛠 Stack

- **Frontend:** Next.js 16 (App Router) + Tailwind CSS v4 + React Query + shadcn/ui
- **Backend:** NestJS 10 + Prisma + PostgreSQL
- **Monorepo:** Turborepo + pnpm workspaces (Node 20+, pnpm 9+)
- **Storage:** Cloudflare R2 (imagens)
- **E-mail:** Resend
- **Pagamento:** Mercado Pago (PIX + cartão, conta CNPJ)
- **Frete:** Melhor Envio (OAuth2)
- **IA descrição:** OpenRouter (Haiku/GPT-4o-mini)
- **Login social:** Google
- **Deploy desenvolvimento:** **NENHUM** (roda 100% local com Docker Compose)
- **Deploy produção:** Hostinger KVM 2 (BR) + Coolify (Issue #25)

## 🎯 Decisões arquiteturais travadas

- Loja única (single-tenant), sem multi-tenant
- Sem PDV (baixa de estoque manual no admin substitui)
- Cadastro obrigatório pra comprar (sem guest checkout)
- Login social: **só Google + e-mail/senha** (Apple removido)
- Reserva de estoque: 15 minutos no carrinho
- Frete grátis por região: NE mais barato, SE/Sul mais caro (config no admin)
- Reviews com foto, moderação manual pela dona
- Wishlist sim
- IA pra gerar descrição de produto via OpenRouter
- Mock funcional de pagamento e frete enquanto credenciais não chegam (`MOCK_PAYMENT=true`, `MOCK_SHIPPING=true`)
- Tasks GRANDES (não fragmentar): 1 grande > 3 pequenas

## 🎨 Identidade visual

- Estilo: minimalista, inspirado em [mirak.com.br](https://www.mirak.com.br/)
- Paleta: marrom/bege/dourado (extraída da logo da Flor de Menina)
- Tipografia: serif elegante (títulos) + sans clean (corpo)
- Mobile-first (80%+ tráfego virá de Instagram → mobile)

## 📁 Estrutura do monorepo

```
flor-de-menina/
├── apps/
│   ├── web/          → Next.js 16 (loja pública + /admin)
│   └── api/          → NestJS 10 (REST API)
├── packages/
│   ├── database/     → Prisma schema + client compartilhado
│   ├── types/        → Tipos TS + Zod schemas
│   └── ui/           → Componentes React compartilhados (shadcn)
├── docs/             → PROJECT.md, CONTRIBUTING.md, DEPLOY.md, SCOPE.md
├── docker-compose.yml
└── turbo.json
```

## 🔄 Convenções

- **TypeScript strict** em todo o projeto
- **Imports absolutos:** `@/`, `@flor/database`, `@flor/types`, `@flor/ui`
- **Nomes em inglês** no código; **comentários e UI em português**
- **Conventional commits em português:** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`
- **Branches:** `feat/NN-nome-curto`, `fix/NN-nome-curto`, `chore/NN-nome-curto` (NN = número da issue)
- **PRs:** referencia issue com `Closes #N`, precisa de CI passing

## 🚦 Workflow de cada task

Pra cada task que você (Claude Code) for executar:

1. **Leia este `CLAUDE.md` primeiro**
2. **🛑 GATE DE VALIDAÇÃO — OBRIGATÓRIO antes de tocar em código:**
   - Leia a issue: `gh issue view N --repo linvex-software/flor-de-menina`
   - Leia o estado atual do projeto (último log de mudanças, status das tasks anteriores)
   - Pergunte explicitamente: **"Esta task ainda faz sentido com as decisões atuais?"**
   - Se sim → siga
   - Se a task tá desatualizada, contradiz decisão recente, ou virou desnecessária → **PARE, explique ao usuário, sugira alternativa (atualizar/remover/dividir).** Não execute às cegas.
   - Exemplo: a Task #3 (deploy gratuito) foi cancelada porque decisão recente foi "sem deploy de dev". Esse tipo de checagem evita retrabalho.
3. Leia `docs/PROJECT.md` e `docs/CONTRIBUTING.md`
4. Confirme branch correta: `git checkout -b <branch-da-issue>`
5. Execute o checklist da issue **em ordem**
6. Rode os testes da issue
7. Faça commits pequenos com conventional commits em português
8. **NÃO faça push automaticamente** — espere validação humana
9. Quando o usuário validar, faça push, abra PR, espere CI, mergeie squash, delete branch
10. **Atualize a seção "Status das tasks" deste arquivo**
11. Adicione entrada no "Log de mudanças" com data e resumo

## 📊 Status das tasks

Atualize esta seção a cada task concluída. Use os emojis:

- ⏳ Em progresso
- ✅ Concluída e mergeada
- 🚫 Cancelada/removida
- ⏸️ Bloqueada (aguardando algo)

| #   | Task                                  | Status                                      | Branch                          | PR  |
| --- | ------------------------------------- | ------------------------------------------- | ------------------------------- | --- |
| 1   | Setup do monorepo                     | ✅ Concluída                                | `chore/01-monorepo-setup`       | #26 |
| 2   | Banco de dados e Prisma               | ✅ Concluída                                | `feat/02-database-prisma`       | #27 |
| 3   | ~~Deploy de desenvolvimento~~         | 🚫 Removida (sem deploy de dev, roda local) | -                               | -   |
| 4   | CI/CD e qualidade de código           | ✅ Concluída                                | `chore/04-ci-quality`           | #28 |
| 5   | Autenticação Admin                    | ✅ Concluída                                | `feat/05-auth-admin`            | #42 |
| 6   | Autenticação Cliente                  | ✅ Concluída                                | `feat/06-auth-cliente`          | #43 |
| 7   | Layout do painel admin                | ✅ Concluída                                | -                               | -   |
| 8   | Layout da loja pública                | ✅ Concluída                                | -                               | -   |
| 9   | Categorias e tabelas de medidas       | ✅ Concluída                                | -                               | -   |
| 10  | Produtos com variações + IA descrição | ✅ Concluída                                | `feat/10-produtos-variacoes-ia` | #47 |
| 11  | Gestão de Estoque com baixa manual    | -                                           | -                               | -   |
| 12  | Catálogo, busca e filtros             | -                                           | -                               | -   |
| 13  | Página de Produto (PDP)               | -                                           | -                               | -   |
| 14  | Carrinho com reserva de estoque       | -                                           | -                               | -   |
| 15  | Wishlist e Conta do Cliente           | -                                           | -                               | -   |
| 16  | Checkout multi-step                   | -                                           | -                               | -   |
| 17  | Integração Melhor Envio               | -                                           | -                               | -   |
| 18  | Integração Mercado Pago               | -                                           | -                               | -   |
| 19  | Webhook MP + finalização              | -                                           | -                               | -   |
| 20  | Sistema de Cupons                     | -                                           | -                               | -   |
| 21  | Sistema de Reviews com foto           | -                                           | -                               | -   |
| 22  | E-mails transacionais (Resend)        | -                                           | -                               | -   |
| 23  | Dashboard admin                       | -                                           | -                               | -   |
| 24  | Páginas institucionais e SEO          | -                                           | -                               | -   |
| 25  | Provisionamento de produção + Go-live | -                                           | -                               | -   |

## 📝 Log de mudanças relevantes

> Anote aqui qualquer decisão importante, mudança de stack, descoberta de bug, ou contexto que sessões futuras precisem saber.

- `2026-05-05` — Projeto iniciado. Decidido sem deploy de dev (Vercel bloqueada, sem Railway). Tudo local até go-live na Hostinger.
- `2026-05-05` — Task #1 (Setup monorepo) concluída e mergeada via PR #26. Adicionado gate de validação de relevância no workflow.
- `2026-05-05` — Task #2 (Banco e Prisma) concluída via PR #27. 20 modelos, Prisma 7, porta 5434.
- `2026-05-06` — Task #4 (CI/CD) concluída via PR #28. Badge, Dependabot, prisma-validate. Branch protection é manual (opcional).
- `2026-05-06` — Task #5 (Auth Admin) implementação completa. API validada (bateria completa: login 200/401, refresh, logout, rate limit, roles, cookies). Frontend: /admin/login, middleware, server actions, logout. Aguardando CI para merge.
- `2026-05-06` — AVISO: JWT não tem denylist/blocklist. Logout apenas limpa cookie no browser; access_token ainda válido por 15min. Implementar blocklist Redis antes do go-live (Task futura).
- `2026-05-06` — Task #6 (Auth cliente) executada. Schema atualizado com Session model. MailService com adapter Maildev. GoogleService com mock. 30/32 testes manuais passados (T3 e T16 com rate limit de dev — comportamento correto). Build OK em ambos apps. Aguardando validação humana.
- `2026-05-06` — FIX: Node.js v25 carrega `.ts` nativamente (type stripping), incompatível com ts-node. Solução: compilar `@flor/database` para `dist/` com `tsc -p tsconfig.build.json`, criar symlink `dist/generated → src/generated`, adicionar `@prisma/client-runtime-utils` como dep direta. API rodada via `node --env-file=.env apps/api/dist/main.js`.
- `2026-05-07` — Task #10 concluída e mergeada via PR #47. CRUD completo de produtos com R2 (3 tamanhos WebP via Sharp), IA via OpenRouter com mock fallback, admin com filtros/bulk/drag-drop/modal IA, 37 testes Jest + 15 E2E Playwright + 8 edge cases de erro, validação visual aprovada. OBS: Category schema mudou na Task #9 (measureTable→sizeChart, position→sortOrder); products.service adaptado.

## ⚠️ Coisas que NÃO podem ser esquecidas

- **NUNCA commitar `.env`** — só `.env.example`
- **NUNCA fazer push sem validação humana** durante desenvolvimento
- **NUNCA pular checklist da issue** sem avisar
- **SEMPRE rodar `pnpm lint && pnpm typecheck && pnpm build`** antes de considerar uma task pronta
- **SEMPRE atualizar este `CLAUDE.md`** ao final de cada task
- **Cookies de cliente vs admin são SEPARADOS**: `flor_customer_token` / `flor_customer_refresh` ≠ `access_token` / `refresh_token` (admin). Nunca cruzar.
- **MAIL_PROVIDER=maildev em dev** → Maildev UI em `http://localhost:1080`. Resend será implementado na Task #22.
- **MOCK_GOOGLE_OAUTH=true em dev** até credenciais reais do Google Cloud Console chegarem.
- **Para subir a API**: `pnpm --filter @flor/api build && node --env-file=.env apps/api/dist/main.js` (não usar `nest start --watch` com Node.js v25).
- **Imagens NÃO são deletadas no soft delete de produto** — preserva histórico de pedidos futuros.
- **OpenRouter sem chave = MOCK MODE** automático, descrição vem com prefixo `[MOCK]`.
- **3 tamanhos por imagem sempre**: thumb (200x200), card (600x800), full (1200x1600) — tudo WebP.
- **Slug único e auto-incremental**: se "vestido-midi" existe, cria "vestido-midi-2", etc.
- **Login admin é `POST /auth/admin/login`** (não `/auth/login`).
- **`slug` package é ESM** — usar a função `slugify()` local em `products.service.ts`.

## 🔗 Links úteis

- Repo: https://github.com/linvex-software/flor-de-menina
- Project board: https://github.com/orgs/linvex-software/projects/7
- Instagram da cliente: https://instagram.com/flordemeninaoficial
- Referência visual: https://www.mirak.com.br/
