# CLAUDE.md — Contexto do projeto Flor de Menina

## 🧠 Filosofia de trabalho (a partir de 11/05/2026)

**O humano é a mente. IA executa.**

Regras de execução:

1. **Humano valida ANTES de confiar em qualquer relatório da IA.** Nunca aceita "tá pronto" sem rodar comando próprio (`git log`, `ls`, smoke test) e ver com os próprios olhos.

2. **Cursor é o agente padrão** pra:
   - Resolução de conflitos (rebase, merge)
   - Tarefas mecânicas e visuais (rename, refactor, mover arquivos)
   - Construção de UI e componentes
   - Testes E2E e validação
   - Qualquer task que se beneficia de ver diff em tempo real

3. **Claude Code é exceção, não regra.** Usar apenas pra:
   - Tasks arquiteturais complexas (decisão de stack, schema, segurança)
   - Migrations grandes ou schema crítico
   - Quando precisa de raciocínio longo sem interação humana

4. **Validação obrigatória depois de cada task:**
   - Roda smoke test manual (curl + browser)
   - Confere `git log` e `git status` com os próprios olhos
   - Lê o diff do PR antes de mergeiar
   - Não confia em relatório de IA sem cruzar com comando real

5. **Antes de qualquer comando destrutivo** (`rm`, `git reset --hard`, `--force`):
   - Para
   - Confere estado atual com `git status` + `git log`
   - Confirma com humano

6. **Quando IA reportar "pronto":**
   - Humano roda os 3 comandos de verificação relevantes
   - Se não bater, pede pra IA mostrar evidência (output do build, do test)
   - Nunca aceita "deve estar funcionando" — exige output real

7. **Prompts curtos > prompts mega:**
   - Prompts de 1000+ linhas geram alucinação
   - Quebrar tarefa em passos menores
   - Cada passo tem validação humana

> Este arquivo é o contexto persistente que **toda sessão do Claude Code DEVE LER ANTES** de começar qualquer trabalho. Atualize este arquivo ao final de cada task concluída.

## 📋 Sobre o projeto

**Cliente:** Flor de Menina (loja de moda física em Maceió-AL, 13 anos, 293k seguidores Instagram, dona Daniela Costa)
**Empresa executora:** Limvex (limvex.com)
**Repo:** `linvex-software/flor-de-menina`
**Domínio:** `flordemenina.store`

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
| 11  | Gestão de Estoque com baixa manual    | ✅ Concluída                                | `feat/11-stock-management`      | -   |
| 12  | Catálogo, busca e filtros             | ✅ Concluída                                | `feat/12-catalogo-busca`        | #50 |
| 13  | Página de Produto (PDP)               | ✅ Concluída                                | `feat/13-pdp-produto`           | -   |
| 14  | Carrinho com reserva de estoque       | ✅ Concluída                                | `feat/14-carrinho-reserva`      | -   |
| 15  | Wishlist e Conta do Cliente           | ✅ Concluída                                | `feat/15-wishlist-conta`        | #54 |
| 16  | Checkout multi-step                   | ✅ Concluída                                | `feat/16-checkout-multistep`    | -   |
| 17  | Integração Melhor Envio               | ✅ Concluída                                | `feat/17-melhor-envio`          | -   |
| 18  | Integração Mercado Pago               | ⏳ Em progresso                             | `feat/18-mercado-pago-backend`  | -   |
| 19  | Webhook MP + finalização              | ✅ Concluída (local)                        | `feat/19-webhook-finalizacao`   | -   |
| 20  | Sistema de Cupons                     | ✅ Concluída                                | `feat/20-cupons`                | #62 |
| 21  | Sistema de Reviews com foto           | -                                           | -                               | -   |
| 22  | E-mails transacionais (Resend)        | ✅ Concluída (local)                        | `feat/22-emails-transacionais`  | -   |
| 23  | Dashboard admin                       | ⏳ Em progresso                             | `feat/23-dashboard-admin`       | -   |
| 24  | Páginas institucionais e SEO          | ✅ Concluída (local)                        | `feat/24-institucionais-seo`    | -   |
| 25  | Provisionamento de produção + Go-live | -                                           | -                               | -   |
| 69  | Admin operacional (escopo reduzido)   | ✅ Pronta pra merge                         | `test/69-admin-operacional`     | -   |

- `2026-05-12` — Domínio global: `flordemenina.site` → `flordemenina.store` em todos os arquivos (seed, E2E, sitemap, robots, footer, templates, adapters, CLAUDE.md, docs).

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
- `2026-05-07` — Task #11 (Gestão de Estoque) implementada. Módulo stock na API com endpoints IN/OUT/ADJUST/counter-sale, SELECT FOR UPDATE contra race condition, histórico paginado com filtros. Admin: /admin/estoque (lista com filtros/alertas), modal de movimentação com Controller (Select controlado), página de histórico por variante. `pnpm dev` agora sobe a API automaticamente via concurrently (nest build + node --watch). Movimentação automática por pedidos será integrada na Task #20.
- `2026-05-07` — Task #12 (Catálogo) construída. Backend: listPublic refatorado com filtros avançados (categorySlug, sizes, colors, minPrice, maxPrice, sort 5 opções) + endpoint GET /products/public/facets. Frontend: ProductCard com hover/badges/swatches, filtros sidebar desktop + bottom sheet mobile (sem nuqs — estado local), sort, paginação "Carregar mais", quick view modal, skeleton, empty state, breadcrumbs. SEO: sitemap dinâmico, robots.txt. Bonus: header-search integrado com /buscar (removido console.log). Pendente: migration pg_trgm precisa ser aplicada quando banco subir (`docker compose up -d`).
- `2026-05-10` — Task #18 BACKEND construído. Adapter pattern (MockPaymentAdapter ativo + MercadoPagoAdapter esqueleto pra #25), endpoints POST /payments/process, GET /payments/:id/status, GET /payments/installments, POST /webhooks/mercado-pago. Idempotência via PaymentEvent.externalEventId UNIQUE. sanitizeForLog em todo payload persistido. PAYMENT_PROVIDER="mock" ativo. Frontend vem em prompt separado.
- `2026-05-09` — Task #12 (Catálogo) concluída e mergeada via PR #50. Backend com pg_trgm typo-tolerant + filtros + facets. Frontend com URL state via nuqs, filter chips, quick view e badges. SEO com sitemap dinâmico e JSON-LD ItemList. Validação final: 67 Vitest + 79 Playwright + 9 bugs corrigidos. TODOs não bloqueantes para Task #25: Lighthouse em produção, a11y completo e color-contrast.
- `2026-05-09` — Task #13 (PDP) construída. Galeria com swipe mobile (Embla) + zoom desktop, variant selector com swatches de cor e chips de tamanho, sticky mobile CTA, calculadora de frete placeholder, wishlist FUNCIONAL (backend CRUD + hook React Query + botão PDP + heart card), Schema.org Product, OG/Twitter cards, "Você também pode gostar" com produtos da mesma categoria, reviews placeholder estruturado, indicador "Restam X peças", breadcrumbs, tabs Descrição/Detalhes/Trocas. Smoke test OK (200/404/401). Próximo: testes automatizados.
- `2026-05-09` — Task #15 (Wishlist e Conta do Cliente) concluída e mergeada via PR #54. Wishlist CRUD idempotente (backend + hook React Query + botão PDP + heart no card). Área /conta com perfil, endereços, pedidos e favoritos.
- `2026-05-10` — Task #17 (Melhor Envio) concluída. Schema Prisma: StoreSettings, RegionShippingRule, MelhorEnvioCredentials, BrazilRegion enum. API: módulo shipping com adapter pattern (mock + ME), criptografia AES-256-GCM, frete grátis regional/global, fallback gracioso com usedFallback:true, 46 testes unitários. Frontend: step-shipping.tsx usa POST /shipping/quote com CEP do checkout, banner de fallback amarelo, erro com retry. Admin: /admin/configuracoes/frete com CEP origem, provedor, OAuth ME, threshold global/regional (inputs controlados). Cart service busca threshold dinâmico do banco (StoreSettings) em vez de constante hardcoded. Bugs corrigidos nesta task: PDP/carrinho mostravam R$0,00 em variantes com price=0 (fallback para basePrice), admin form não salvava compareAtPrice vazio (Zod .catch), home Destaques mostrava todos os produtos (filtro isFeatured), error.tsx adicionado ao admin, nest-cli.json deleteOutDir:false (watch estável). GET /orders/shipping-options removido.
- `2026-05-11` — Task #19 implementada. WebhookSimulatorService + MockPaymentAdapter determinístico via Map (getPaymentStatus sem Math.random). handleWebhook finaliza pedido com `$transaction` **Serializable** (Payment/PaymentEvent/Order + StockService e CartService) e dispara EmailService (skeleton, logs `[EMAIL_TRIGGER]`). Assinatura inválida: **401** `UnauthorizedException`. Frontend: rota dedicada `/checkout/falha/[id]`, redirects em falha e melhorias na confirmação. Validação: Jest API + smoke PIX/cartão + E2E ajustados (PDP “Adicionar à sacola” / Minha Sacola).
- `2026-05-09` — Task #16 (Checkout multi-step) concluída. Fluxo de 5 etapas: Identificação → Endereço → Frete → Pagamento → Revisão. CheckoutContext com sessionStorage, stepper visual, validação CPF completa (algoritmo + dígitos verificadores), $transaction atômico no createOrder (Order + StockMovement + limpeza carrinho), página de confirmação Server Component com cookie forwarding. CustomerProfileService getOrders/getOrder implementados. Bugs corrigidos: 403 cross-user, dropdown de parcelas, payload de variantes no admin, endpoint de categorias admin.
- `2026-05-08` — Task #14 (Carrinho) concluída. Módulo cart na API com CRUD + merge + SELECT FOR UPDATE contra race condition. CartCleanupService (@Cron a cada 5min) libera reservas expiradas. Frontend: CartProvider com merge localStorage→servidor no login, mini-carrinho drawer, página /carrinho com debounce, timer de reserva colorido e barra de frete grátis. LocalCartItemSnapshot: visitante vê nome/preço/estoque real sem precisar de API. Campo de cupom fica para Task #20.

- `2026-05-12` — **#23 em andamento** na branch `feat/23-dashboard-admin`: spec `docs/specs/23-dashboard-admin.md`, API (`/admin/dashboard/summary`, `/admin/orders`), web (dashboard Recharts, pedidos, estoque `?status=`), testes Jest + Playwright. Reviews/moderação **fora do escopo** (#21 descartada). Card conversão omitido (spec). Aguardando validação e PR (`Closes #23`).

- `2026-05-12` — Task #24 concluída (local). API `pages` (CRUD admin + público). Prisma `InstitutionalPage` (`metaTitle`/`metaDescription` @map seo\*, `ogImage`, `sortOrder`, índice `isActive`). Seed HTML + `pnpm db:seed:institutional`. Admin `/admin/paginas` (TipTap, SEO). Loja `/p/[slug]` com **`dynamic = 'force-dynamic'`** e **`fetch` `cache: 'no-store'`** (edição e ativo/inativo no próximo acesso — sem ISR 60s que cacheava página desativada). Sitemap/robots, metadataBase, JSON-LD Organization, GTM/Pixel opcionais. Footer → `/p/...`; `/quem-somos` → `/p/sobre`. PDP: Product schema (preço mín. variante, descrição texto). Migration `20260512130000_institutional_page_og_sort_index`. `run-with-root-env.cjs`: Prisma via `node …/prisma/build/index.js` (Windows). Seed: libera CPF demo duplicado antes do upsert.

- `2026-05-13` — Task #69 finalizada (`test/69-admin-operacional`). Spec `docs/spec-69-admin-operacional.md`. API: `PATCH /admin/orders/:id/status`, histórico `OrderStatusHistory`, passo “preparando envio” = **`PROCESSING`**. E-mails operacionais: SMTP Maildev em dev; produção enfileira shipped/delivered via `MailService`. Pós-validação: labels PT-BR (`status-labels.ts`), toast em todo sucesso de PATCH, HTML Mirak (`renderEmailLayout`), breadcrumb Admin sem link, select controlado. Jest + E2E; smoke Maildev. Pronta pra push + PR + merge.

- `2026-05-12` — Task #22 (E-mails transacionais) concluída e validada localmente. BullMQ+Redis, 8 templates React Email, EmailLog com idempotência, ResendAdapter (lazy init), MaildevAdapter para dev. Triggers em OrdersService (ORDER_CREATED) e PaymentsService (PAYMENT_APPROVED/REJECTED). Cron ReviewInvitationCron (10h diário). Admin UI: logs com filtros/resend e preview com iframe. Validado: PASSWORD_RESET, ORDER_CREATED, PAYMENT_APPROVED chegando no Maildev. REDIS_PASSWORD configurado para limvex-redis compartilhado (senha no .env local, não commitar). PAYMENT_PROVIDER mudado para "mock" para testes locais.

## ⚠️ Coisas que NÃO podem ser esquecidas

- **Páginas institucionais**: API pública `GET /pages` (resumo) e `GET /pages/:slug` (HTML TipTap). Conteúdo só em `dangerouslySetInnerHTML` na loja. Admin em `/admin/paginas`. Loja `/p/[slug]`: **`export const dynamic = 'force-dynamic'`** + **`fetch(..., { cache: 'no-store' })`** (sem ISR — ativo/inativo e conteúdo refletem no próximo acesso). Seed só institucionais: `pnpm db:seed:institutional`.
- **Redis na porta 6379** — adicionado ao docker-compose. Necessário para BullMQ (fila de emails). Subir com `docker compose up -d redis`.
- **Migration pendente**: `add_email_logs_and_order_shipping`, `20260512130000_institutional_page_og_sort_index` e **`20260513120000_add_order_status_history`** (#69) — rodar `pnpm --filter @flor/database db:migrate` quando Docker estiver ativo.
- **BullMQ fila `mail`**: worker em `MailProcessor`, producer em `MailService.enqueue()`. Retry 3x com backoff exponencial (30s, 5min, 30min).
- **`EmailLog` no Prisma** — auditoria completa de cada envio. `idempotencyKey` garante que o mesmo evento nunca dispara duplicado mesmo com webhook retentando N vezes.
- **`MailService`** (em `mail/`) é o canal principal em produção — `EmailService` delega para ele nos fluxos antigos; **Task #69** usa SMTP direto (Maildev) em dev e enfileira `ORDER_SHIPPED`/`ORDER_DELIVERED` via `MailService` em produção. Não chamar MaildevAdapter diretamente de outros módulos.
- **Templates React Email** em `apps/api/src/mail/templates/emails/` — renderizados server-side via `@react-email/render`.
- **`RESEND_API_KEY` obrigatória em produção** — sem ela o `ResendAdapter` falha no boot.
- **`APP_URL`** — URL da loja nos links dos emails (default `http://localhost:3000`).
- **Cron `ReviewInvitationCron`**: roda 10h todo dia, busca pedidos com `shippedAt` ≥ 7 dias atrás sem `EmailLog REVIEW_INVITATION SENT`.
- **`Order.shippedAt` + `Order.trackingCode`** — definir ao marcar pedido como SHIPPED (admin #69); e-mail: `EmailService` (SMTP Maildev em dev) ou fila `MailService.sendOrderShipped()` em produção.
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
- **`/produtos` e `/categoria/[slug]` usam Server Component para metadata + CatalogClient (Client) para interatividade**
- **Mobile: filtros em bottom sheet (`side="bottom"`)** — não drawer lateral
- **Paginação "Carregar mais"** — não infinite scroll automático (decisão proposital)
- **Quick view tem TODO(task-#15)** — integrar carrinho já está feito; wishlist integrar quando Task #15 chegar
- **Migration pg_trgm** criada em `packages/database/prisma/migrations/20260507220000_pg_trgm_search/` — aplicar com banco ativo via `pnpm --filter @flor/database db:migrate`
- **Categorias API pública**: GET `/categories` (lista árvore) e GET `/categories/:slug` (detalhe) — usados no sitemap e na página de categoria
- **pg_trgm extension é OBRIGATÓRIA** — a busca typo-tolerant quebra sem ela; garantir migration em ambientes novos
- **Filtros sincronizam com URL via nuqs** (`useQueryStates({ history: 'replace' })`) — mudanças devem ser compartilháveis
- **Sitemap consome `/products/public` e `/categories` paginado** — manter API pública acessível em produção
- **Wishlist funcional na PDP e no card** — backend CRUD completo (idempotente). Página /conta/favoritos fica pra Task #15.
- **Carrinho funcional** — CartProvider + API /cart CRUD + merge. Campo de cupom fica para Task #20.
- **Cálculo de frete é PLACEHOLDER** — retorna mock fixo (TODO task-#17)
- **Reviews é placeholder** — seção visível mas vazia na loja; issue de moderação/PDP (#21) foi descartada — evolução só com nova issue
- **Compre junto** — 4 produtos da mesma categoria, orderBy isFeatured desc + createdAt desc
- **Schema.org Product** — InStock/OutOfStock conforme totalStock
- **Sticky mobile CTA** — fixo no rodapé só em mobile (md:hidden)
- **`/produto/[slug]`** — Server Component com metadata dinâmica + Schema.org + PdpClient como Client Component
- **Guard de wishlist/cart**: `CustomerJwtGuard` (não `CustomerJwtAuthGuard`) — classe se chama `CustomerJwtGuard` em `auth/customer/customer-jwt.guard.ts`
- **Carrinho de visitante usa `LocalCartItemSnapshot`** — salvo no localStorage junto com variantId/qty para exibir nome, preço e estoque real sem API. Estoque no snapshot é bruto (sem reservas de outros); validação real acontece no merge/checkout.
- **Reserva de estoque**: 15min, `CartItem.reservedUntil`. Cleanup job a cada 5min. Fórmula: `estoque disponível = variant.stock - SUM(reservas ativas de outros carrinhos)`.
- **Merge de carrinho**: `POST /cart/merge` — chamado automaticamente quando `prevUserId.current === null → userId` no CartProvider. Itens incompatíveis geram toast de aviso.
- **Checkout multi-step**: 5 etapas via state (não URL). CheckoutContext persiste em sessionStorage; limpa automaticamente se usuário logado divergir do email salvo (evita 403 cross-user). Dados de cartão NUNCA persistem — só `{ method }`. Página de confirmação é Server Component com cookie forwarding via `next/headers`. getOrders/getOrder implementados em CustomerProfileService. Frete e pagamento são mock (tasks #17/#18).
- **Upsert de variantes no admin**: payload deve enviar apenas os campos do VariantInput DTO (sem productId/createdAt/updatedAt do Prisma) e converter price para Number — ValidationPipe com forbidNonWhitelisted rejeita campos extras com 400.
- **ENCRYPTION_KEY obrigatória**: API falha no boot se `ENCRYPTION_KEY` não tiver 64 chars hex. Gere com: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- **Módulo shipping**: adapter selecionado por `StoreSettings.shippingProvider` (banco) — não pela env var diretamente. A env var `SHIPPING_PROVIDER` é só usada na criação do singleton inicial no `getOrCreateSettings()`.
- **Frete grátis**: lógica em `ShippingService.getFreeShippingThreshold()` — regra regional > threshold global > null (sem frete grátis). Opção grátis é adicionada como clone da mais barata com cost=0.
- **Tokens ME criptografados**: formato `iv:authTag:ciphertext` em hex. Refresh automático quando `expiresAt - now < 5min`.
- **Mapeamento CEP→Região**: faixas precisas dos Correios implementadas em `cep-to-region.ts` — TO (77000-77999) e RO (76800-76999, 78900-78999) são Norte, MS (79000-79999) é CO.
- **GET /orders/shipping-options REMOVIDO** na task #17 — usar POST /shipping/quote.
- **PAYMENT_PROVIDER controla qual adapter** ("mock" | "mercado_pago"). Default: mock. Trocar na Task #25.
- **Webhook é idempotente** via PaymentEvent.externalEventId UNIQUE. Chamada 2x com mesmo eventId processa só 1x.
- **NUNCA logar cardNumber, CVV, access_token, webhook_secret** — usar sanitizeForLog() antes de persistir/logar.
- **MercadoPagoAdapter é esqueleto** — métodos lançam NotImplementedException. Real na Task #25.
- **Webhook POST /webhooks/mercado-pago**: processamento OK → **200**; assinatura inválida → **401**; falha de servidor → **5xx** (logs). Idempotência + isolamento Serializable reduzem corrida em eventos duplicados/atrasados.
- **MOCK_PIX_APPROVAL_RATE / MOCK_CARD_APPROVAL_RATE** (0–1) no `.env` — taxa no mock adapter (com Map de estado + webhook simulado); não usar `Math.random` no `getPaymentStatus`.
- **Task #69 — Admin operacional**: transições rígidas `PAID → PROCESSING → SHIPPED → DELIVERED` ou cancelamento (sem cancelar após `SHIPPED`/`DELIVERED`). `SHIPPED` exige `trackingCode`. Cancelamento com estoque: `restoreStockForOrder` + `reverseCouponUsage`. Histórico em `OrderStatusHistory`. E-mail dev: Maildev `http://localhost:1080` (SMTP). Opcional: `WHATSAPP_SUPPORT_URL` e **`INSTAGRAM_URL`** no `.env` para links no rodapé do HTML operacional.
- **Labels PT-BR centralizados em `apps/web/src/lib/orders/status-labels.ts`** — toda UI de pedidos admin usa `getStatusLabel()` / `getTransitionLabel()`, nunca renderiza enum raw.
- **Templates de e-mail operacionais (Task #69)** em `EmailService`: helper `renderEmailLayout()` — header + card + footer padronizado (SMTP / Maildev em dev).

## 🔗 Links úteis

- Repo: https://github.com/linvex-software/flor-de-menina
- Project board: https://github.com/orgs/linvex-software/projects/7
- Instagram da cliente: https://instagram.com/flordemeninaoficial
- Referência visual: https://www.mirak.com.br/
