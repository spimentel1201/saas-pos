FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=384"

RUN apk add --no-cache libc6-compat openssl python3 make g++
RUN corepack enable && corepack prepare pnpm@11.17.0 --activate

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/api/package.json ./apps/api/
COPY packages/types/package.json ./packages/types/
COPY packages/storage/package.json ./packages/storage/
COPY packages/ui/package.json ./packages/ui/
RUN pnpm install --frozen-lockfile

COPY apps/api/prisma ./apps/api/prisma
RUN cd apps/api && npx --yes prisma@6 generate

COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json
RUN cd apps/api && npx tsc -p tsconfig.json
RUN cp -r apps/api/prisma/tenants apps/api/dist/prisma/tenants 2>/dev/null || true

EXPOSE 3000
CMD ["node", "--max-old-space-size=384", "apps/api/dist/main.js"]
