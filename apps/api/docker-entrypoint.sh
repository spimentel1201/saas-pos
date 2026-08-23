#!/bin/sh
set -e

echo "Running migrations..."
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma

echo "Seeding database..."
npx tsx apps/api/prisma/seed.ts || echo "Seed skipped (data may already exist)"

echo "Starting server..."
exec node --max-old-space-size=512 apps/api/dist/main.js
