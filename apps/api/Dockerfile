FROM node:22-alpine
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY apps/api/package.json ./
RUN npm install --omit=dev prisma@6 @prisma/client@6

COPY apps/api/prisma ./prisma
RUN npx prisma generate --schema=prisma/schema.prisma

COPY apps/api/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
