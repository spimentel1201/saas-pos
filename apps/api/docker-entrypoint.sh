#!/bin/sh
set -e

echo "Pushing schema to database..."
npx --yes prisma@6 db push --schema=apps/api/prisma/schema.prisma --accept-data-loss

echo "Seeding database..."
npx --yes tsx apps/api/prisma/seed.ts || echo "Seed skipped (data may already exist)"

echo "Starting server..."
exec node --max-old-space-size=512 apps/api/dist/main.js
