# ALTERNATIVAS GRATUITAS PARA DESPLEGUE

## 1. Railway (Recomendado) ⭐

**Free tier:** $5/mes de crédito (suficiente para este proyecto)

### Pasos:
1. Ir a [railway.app](https://railway.app)
2. Crear cuenta con GitHub
3. New Project → Deploy from GitHub repo
4. Seleccionar repositorio y branch
5. Agregar PostgreSQL y Redis (click +)

### Costo estimado:
| Servicio | Costo |
|----------|-------|
| API (512MB RAM) | ~$2 |
| PostgreSQL | ~$1 |
| Redis | ~$1 |
| **Total** | **~$4/mes** (dentro del free tier) |

### Ventajas:
- Dockerfile detectado automáticamente
- Variables de entorno fáciles de configurar
- Logs en tiempo real
- Auto-deploy en cada push

---

## 2. Fly.io

**Free tier:** 3 shared-cpu-1x (256MB RAM) + 3GB Storage

### Pasos:
```bash
# Instalar flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Crear app
cd apps/api
fly launch

# Agregar PostgreSQL
fly postgres create --name pos-saas-db

# Agregar Redis
fly redis create --name pos-saas-redis

# Deploy
fly deploy
```

### Limitaciones:
- 3GB storage para PostgreSQL
- 160GB transferencia/mes

---

## 3. Koyeb

**Free tier:** 1 nano service + PostgreSQL

### Pasos:
1. Ir a [koyeb.com](https://koyeb.com)
2. Conectar GitHub
3. Crear servicio Docker
4. Agregar PostgreSQL addon

### Limitaciones:
- 512MB RAM
- 1GB storage

---

## 4. Cyclic.sh

**Free tier:** Apps duermen tras 15 min inactividad

### Pasos:
1. Ir a [cyclic.sh](https://cyclic.sh)
2. Conectar GitHub
3. Deploy automático

### Limitaciones:
- Cold start ~30s
- 1000 requests/día

---

## 5. Supabase + Vercel

**Free tier:** PostgreSQL 500MB + Serverless functions

### Setup:
1. **Supabase** (Database):
   - Crear proyecto gratuito
   - Copiar connection string

2. **Vercel** (API):
   - Adaptar NestJS a serverless
   - Usar `@nestjs/platform-express` en vez de Fastify

### Limitaciones:
- PostgreSQL: 500MB, 50,000 rows
- Serverless: 10s timeout
- No soporta WebSocket/BullMQ

---

## Recomendación

**Railway** es la mejor opción porque:

1. **Free tier generoso** — $5/mes cubre todo
2. **Docker nativo** — Tu Dockerfile funciona sin cambios
3. **PostgreSQL + Redis** — Incluidos, sin configuración extra
4. **Auto-deploy** — Cada push actualiza la app
5. **Sin cold start** — Always-on a diferencia de serverless
6. **Variables de entorno** — Interfaz visual fácil

### Configuración rápida en Railway:

```yaml
# Variables de entorno en Railway Dashboard
DATABASE_URL=<auto-generado por PostgreSQL addon>
REDIS_URL=<auto-generado por Redis addon>
JWT_ACCESS_SECRET=<generar UUID>
JWT_REFRESH_SECRET=<generar UUID>
TENANT_BASE_DOMAIN=<tu-dominio.railway.app>
NODE_ENV=production
API_PORT=3000
```

### Build Command:
```bash
pnpm install --frozen-lockfile && cd apps/api && pnpm prisma:generate && pnpm build
```

### Start Command:
```bash
cd apps/api && node dist/main.js
```

### Post-deploy:
```bash
cd apps/api && npx prisma migrate deploy
```
