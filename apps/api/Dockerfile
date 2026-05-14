# Build
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api

# Coolify injeta NODE_ENV=production no build; sem devDependencies o install do monorepo falha.
RUN NODE_ENV=development pnpm install --frozen-lockfile
RUN pnpm --filter @flor/database db:generate
RUN pnpm --filter @flor/database build
# @flor/types publica só dist/ — sem este passo o nest build não acha os .d.ts (diferente do web, que mapeia paths → src)
RUN pnpm --filter @flor/types build
RUN pnpm --filter @flor/api build

# Runtime
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat curl
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nestjs

WORKDIR /app

COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

USER nestjs

EXPOSE 3333
ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3333/health || exit 1

CMD ["node", "apps/api/dist/main.js"]
