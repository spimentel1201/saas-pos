FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.17.0 --activate

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/storage/package.json ./packages/storage/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .

RUN cd apps/api && npx --yes prisma@6 generate
RUN cd apps/api && npx tsc -p tsconfig.json
RUN cd apps/api && node -e "import('fs').then(fs => fs.cpSync('prisma/tenants', 'dist/prisma/tenants', { recursive: true }))"

FROM base AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=384"

RUN apk add --no-cache libc6-compat openssl

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/storage/package.json ./packages/storage/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

RUN cd apps/api && npx --yes prisma@6 generate

EXPOSE 3000
CMD ["node", "--max-old-space-size=384", "apps/api/dist/main.js"]
