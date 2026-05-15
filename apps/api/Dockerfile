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
# @flor/types publica só dist/ — sem este passo o nest build não acha os .d.ts
RUN pnpm --filter @flor/types build
RUN pnpm --filter @flor/api build
# Cria bundle de produção com apenas as deps necessárias
RUN pnpm --filter @flor/api deploy --prod /app/deploy
# Achar e copiar o Prisma Client gerado para dentro do bundle (caminho com hash do pnpm)
RUN find /app/deploy/node_modules -path "*/@flor/database/dist" -type d | head -1 | xargs -I{} cp -r /app/packages/database/src/generated {}/generated
# Copia o prisma CLI para o bundle (necessário para rodar migrations em runtime)
RUN cp -r /app/node_modules/.bin/prisma /app/deploy/node_modules/.bin/prisma 2>/dev/null || true
RUN cp -r /app/node_modules/prisma /app/deploy/node_modules/prisma 2>/dev/null || true

# Runtime
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat curl
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nestjs
WORKDIR /app
COPY --from=builder /app/deploy/node_modules ./node_modules
COPY --from=builder /app/deploy/package.json ./package.json
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/packages/database/prisma ./prisma
COPY --from=builder /app/packages/database/prisma.config.ts ./prisma.config.ts
USER nestjs
EXPOSE 3333
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -fsS http://127.0.0.1:3333/health || exit 1
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]
