FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/storage/package.json ./packages/storage/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN cd apps/api && npx -y prisma@6 generate --schema=prisma/schema.prisma
RUN cd apps/api && npx -y tsc -p tsconfig.json

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=384"
RUN apk add --no-cache libc6-compat openssl

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY apps/api/package.json ./

RUN npm install --omit=dev && npm install prisma@6
RUN npx prisma generate --schema=prisma/schema.prisma

EXPOSE 3000
CMD ["node", "--max-old-space-size=384", "dist/main.js"]
