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
RUN pnpm --filter @flor/types build
RUN pnpm --filter @flor/api build
# Cria bundle de produção com APENAS as deps necessárias (resolve o problema do zod)
RUN pnpm --filter @flor/api deploy --prod /app/deploy

# Runtime
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat curl
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nestjs
WORKDIR /app
# Copia o bundle limpo gerado pelo pnpm deploy
COPY --from=builder /app/deploy/node_modules ./node_modules
COPY --from=builder /app/deploy/package.json ./package.json
# Copia o dist compilado
COPY --from=builder /app/apps/api/dist ./dist
# Copia os packages internos compilados
COPY --from=builder /app/packages ./packages
USER nestjs
EXPOSE 3333
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3333/health || exit 1
CMD ["node", "dist/main.js"]
