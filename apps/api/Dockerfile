# Build
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate
WORKDIR /app
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN NODE_ENV=development pnpm install --frozen-lockfile
RUN pnpm --filter @flor/database db:generate
RUN pnpm --filter @flor/database build
RUN pnpm --filter @flor/types build
RUN pnpm --filter @flor/api build
RUN pnpm --filter @flor/api deploy --prod /app/deploy
# Copia o Prisma Client gerado para dentro do deploy
RUN cp -r /app/packages/database/src/generated /app/deploy/node_modules/@flor/database/src/generated

# Runtime
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat curl
RUN addgroup -g 1001 nodejs && adduser -S -u 1001 -G nodejs nestjs
WORKDIR /app
COPY --from=builder /app/deploy/node_modules ./node_modules
COPY --from=builder /app/deploy/package.json ./package.json
COPY --from=builder /app/apps/api/dist ./dist
USER nestjs
EXPOSE 3333
ENV NODE_ENV=production
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3333/health || exit 1
CMD ["node", "dist/main.js"]
