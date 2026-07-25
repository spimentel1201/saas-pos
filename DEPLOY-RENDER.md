# DESPLIEGUE EN RENDER.COM

Guía paso a paso para desplegar el API en Render.com.

## Pre-requisitos

1. Cuenta en [Render.com](https://render.com)
2. Repositorio en GitHub con el código
3. Dominio propio (opcional pero recomendado)

## Opción 1: Despliegue con render.yaml (Recomendado)

### Pasos

1. **Clonar el repositorio en Render:**
   - Ir a Dashboard → New → Blueprint
   - Conectar repositorio GitHub
   - Seleccionar rama `feature/sprint6-codes-storage-notifications-tests`
   - Render detectará `render.yaml` automáticamente

2. **Configurar variables de entorno:**
   - En el dashboard de cada servicio, ir a Environment
   - Configurar valores sensibles (Stripe, Cloudinary, SMTP)

3. **Desplegar:**
   - Render ejecutará `preDeployCommand` automáticamente
   - El API estará disponible en `https://pos-saas-api.onrender.com`

### Servicios creados

| Servicio | Tipo | Plan |
|----------|------|------|
| `pos-saas-api` | Web Service (Docker) | Starter |
| `pos-saas-db` | PostgreSQL | Starter |
| `pos-saas-redis` | Redis | Starter |

## Opción 2: Despliegue Manual

### Paso 1: Crear PostgreSQL

1. Dashboard → New → PostgreSQL
2. Nombre: `pos-saas-db`
3. Plan: Starter ($7/mes)
4. Copiar `Internal Database URL`

### Paso 2: Crear Redis

1. Dashboard → New → Redis
2. Nombre: `pos-saas-redis`
3. Plan: Starter ($7/mes)
4. Copiar `Internal Redis URL`

### Paso 3: Crear Web Service

1. Dashboard → New → Web Service
2. Conectar repositorio GitHub
3. Configurar:
   - **Name:** `pos-saas-api`
   - **Runtime:** Docker
   - **Dockerfile Path:** `./apps/api/Dockerfile`
   - **Docker Context:** `.`
   - **Plan:** Starter ($7/mes)

### Paso 4: Variables de Entorno

```bash
# Base
NODE_ENV=production
API_PORT=3000

# Database (del paso 1)
DATABASE_URL=<tu-internal-database-url>

# Redis (del paso 2)
REDIS_URL=<tu-internal-redis-url>

# Auth (generar valores únicos)
JWT_ACCESS_SECRET=<generar-uuid>
JWT_REFRESH_SECRET=<generar-uuid>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=7d

# Dominio
TENANT_BASE_DOMAIN=tu-dominio.com

# Stripe (opcional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Cloudinary (opcional)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=<app-password>
FROM_EMAIL=noreply@tu-dominio.com
```

### Paso 5: Configurar Build & Deploy

En la configuración del servicio:

- **Build Command:**
  ```bash
  pnpm install --frozen-lockfile && cd apps/api && pnpm prisma:generate && pnpm build
  ```

- **Pre-Deploy Command:**
  ```bash
  cd apps/api && npx prisma migrate deploy
  ```

- **Start Command:**
  ```bash
  cd apps/api && node dist/main.js
  ```

## después del Despliegue

### 1. Ejecutar Seed (opcional)

Para poblar con datos de prueba:

```bash
# En Render Shell
cd apps/api && pnpm db:seed
```

### 2. Verificar Salud

```bash
curl https://pos-saas-api.onrender.com/api/v1/docs
```

### 3. Configurar Webhook Stripe

```bash
stripe listen --forward-to https://pos-saas-api.onrender.com/api/v1/billing/webhook
```

## Dominio Personalizado

1. En Render, ir a Settings → Custom Domains
2. Agregar dominio: `api.tu-dominio.com`
3. Configurar DNS:
   ```
   CNAME  api.tu-dominio.com  → pos-saas-api.onrender.com
   ```
4. Actualizar `TENANT_BASE_DOMAIN` a `tu-dominio.com`

## Variables Críticas

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `DATABASE_URL` | PostgreSQL connection | ✅ Sí |
| `REDIS_URL` | Redis connection | ✅ Sí |
| `JWT_ACCESS_SECRET` | Secret for JWT access tokens | ✅ Sí |
| `JWT_REFRESH_SECRET` | Secret for JWT refresh tokens | ✅ Sí |
| `TENANT_BASE_DOMAIN` | Dominio base para tenants | ✅ Sí |
| `STRIPE_SECRET_KEY` | API key de Stripe | ❌ No* |
| `CLOUDINARY_*` | Credenciales Cloudinary | ❌ No* |

*Opcional pero requerido para funcionalidad completa

## Costos Estimados

| Servicio | Plan | Costo/mes |
|----------|------|-----------|
| Web Service (API) | Starter | $7 |
| PostgreSQL | Starter | $7 |
| Redis | Starter | $7 |
| **Total** | | **$21/mes** |

## Troubleshooting

### Error: "Cannot find module '@prisma/client'"

Verificar que `prisma generate` se ejecuta en el build:
```bash
# En build command
pnpm install --frozen-lockfile && cd apps/api && pnpm prisma:generate && pnpm build
```

### Error: "relation does not exist"

Las migraciones no se ejecutaron. Verificar `preDeployCommand`:
```bash
cd apps/api && npx prisma migrate deploy
```

### Error: "ECONNREFUSED" a PostgreSQL

Verificar que `DATABASE_URL` usa el formato correcto:
```
postgresql://user:password@host:5432/dbname?schema=public
```

### Logs

Verificar logs en Render Dashboard → Service → Logs

## Backups

### PostgreSQL

Render ofrece backups automáticos para planes Starter+.

Manual:
```bash
pg_dump $DATABASE_URL > backup.sql
```

### Restaurar

```bash
psql $DATABASE_URL < backup.sql
```

## Seguridad

1. **Nunca commitear `.env`** - Usar variables de entorno de Render
2. **Rotar secrets** - Cambiar JWT secrets periodicamente
3. **HTTPS** - Render provee automáticamente
4. **Rate Limiting** - Configurar en NestJS (ya implementado)
