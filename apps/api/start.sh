#!/bin/sh
set -e
echo "Running migrations..."
npx prisma migrate deploy --schema=/app/node_modules/.pnpm/@flor+database*/node_modules/@flor/database/prisma/schema.prisma
echo "Starting API..."
exec node dist/main.js
