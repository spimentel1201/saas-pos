# AGENTS.md

Instrucciones para sesiones OpenCode (y DevelOff) que trabajen en este repo.

El contexto profundo está en `PLAN-MVP-POS-SAAS.md` — léelo antes de tocar arquitectura.

## Setup

```bash
pnpm install
pnpm docker:up          # Postgres 16 + Redis 7 + Mailhog
cp .env.example .env    # copia y rellena cloudinary/stripe ASAP
pnpm --filter @pos/api prisma:migrate
pnpm dev                # turbo: api:3000 + web:3001
```

Requisitos: Node 20.10+, pnpm 9+, Docker.

## Comandos canónicos

```bash
pnpm typecheck         # tsc --noEmit workspace-wide (corre SIEMPRE antes de commit)
pnpm lint              # biome check . (no hay eslint separado)
pnpm format            # biome format --write .
pnpm test              # vitest run (unit + integracion)
pnpm test:e2e          # playwright en apps/web
pnpm build             # turbo build (todo el workspace)
```

NO uses `npm` ni `yarn` — el lockfile es `pnpm-lock.yaml`. No hay ESLint ni Prettier: el formato y lint son **Biome** (`biome.json` raíz). Trabajas en un solo package con `pnpm --filter @pos/<name> <script>`.

## Reglas que el repo te ahorran de adivinar

- **No use stored procedures.** Ver `PLAN-MVP-POS-SAAS.md` §9. Para reportes pesados usa materialized views (ver `§11` y `apps/api/prisma/tenants/template.sql`).
- **No uses Prisma client directamente fuera de `infrastructure/repositories/`.** Inyecta siempre un `*Repository` desde `application/`.
- **Estructura DDD-lite obligatoria en cada módulo** (`domain/ ← application/ ← infrastructure/`). `domain/` no importa NestJS ni Prisma. Ver `§4.2`.
- **Multi-tenant es schema-per-tenant.** Para acceder a tablas tenant usa `TenantPrismaService.withTenant(fn)` (resuelve `search_path` automáticamente desde `TenantContext`). Para tablas compartidas usa `PrismaService`.
- **Comunicación inter-módulos:** 1) llamada directa a ApplicationService vía DI, 2) `@nestjs/event-emitter` para side effects, 3) BullMQ para async real. Nunca importes directamente el `infrastructure/` de otro módulo.
- **Errores:** lanza `DomainError` / `NotFoundError` / `ConflictError` (ver `apps/api/src/shared/domain/errors/`). El filtro global los convierte a RFC7807 Problem Details. No lanzar `HttpException` desde `domain/`.
- **Endpoints tenant-scoped** deben llevar `@TenantRequired()`. El guard niega con 404 si no hay tenant (deliberado, no 403).
- **Multi-tenant nuevo tenant:** la API corre `prisma/tenants/create-schema.ts <schema_name>` que aplica `template.sql` contra PostgreSQL con el nombre sustituido. El script valida `schema_name` contra regex estricta — no expandas esa validación sin revisión.
- **Imágenes:** TODO subir mediante `StorageProvider` (`@pos/storage`). Frontend pide signature a `POST /api/v1/uploads/sign` y hace upload directo a Cloudinary — el backend NUNCA recibe la imagen. Para futuros providers añadir clase impl en `packages/storage/src/`.

## Antes de un commit

1. `pnpm typecheck` pasa limpio.
2. `pnpm lint` pasa limpio.
3. `pnpm test` pasa (al menos el paquete afectado).
4. Si tocaste `schema.prisma` o `template.sql`, documenta en el mensaje del commit qué schema se ve afectado (shared vs tenant) y si requiere correr `prisma:migrate`.

No uses `git commit --no-verify`. El pre-commit ejecuta `biome check --staged` — deja que corrija.

## Tests

- Vitest para unit/integration. Config en cada `vitest.config.ts`.
- E2E con Playwright sólo en `apps/web` (`pnpm test:e2e`).
- NO existe una suite de tests de API "intercambio HTTP" todavía — añádela como `*.e2e.spec.ts` con `supertest` contra Fastify under testing module si la necesitas.

## Migraciones Prisma

- `apps/api/prisma/schema.prisma` = base compartida (`public`).
- `apps/api/prisma/tenants/template.sql` = esquema tenant (aplicado por tenant). Al tocarlo, los tenants **ya existentes** no se migran automáticamente — requiere script one-shot. Documentar el migrador en el PR.
- `SHADOW_DATABASE_URL` existe para `prisma migrate dev` (ver `docker/postgres/init.sql`).

## Errores comunes que consumen tiempo

- Olvidar activar el contexto tenant en un endpoint nuevo —> queries caen en `public` y devuelven 0 filas. Solución: `@TenantRequired()` + usar `TenantPrismaService`, no `PrismaService`.
- Importar desde `infrastructure/` de otro módulo (acoplamiento) —> refactoriza vía puerto o evento.
- Llamar a `this.prisma.foo.findMany()` desde un caso de uso en `application/` sin pasar por el repository —> rompe testabilidad.
- Actualizar `template.sql` y olvidar que los tenants existentes no se re-aplican.
- Esperar que el `Prisma client` conozca las tablas tenant —> no las conoce (viven en otro schema aplicado con SQL crudo). Para queries tenant usa `$queryRaw` o un mapper manual dentro del repository.

## Documentos que debes leer primero

- `PLAN-MVP-POS-SAAS.md` — el plan maestro. **Obligatorio antes de tocar arquitectura.**
- `apps/api/src/app.module.ts` — composicion real de los 14 módulos.
- `apps/api/src/shared/infrastructure/multi-tenant/tenant-context.ts` — corazón del multi-tenant.
- `apps/api/prisma/schema.prisma` + `apps/api/prisma/tenants/template.sql` — origen de verdad del modelo de datos.

## Convención de commits

Usar conventional commits en español está bien: `feat: ...`, `fix: ...`, `refactor: ...`, `test: ...`, `docs: ...`, `chore: ...`. Si afecta un módulo, prefija: `feat(sales): arqueo de caja`.

## Habilidades instaladas (skills)

Las siguientes skills se cargan automáticamente desde `.agents/skills/` cuando se inicia una sesión. Se activan cuando la tarea coincide con su descripción:

| Skill | Cuándo activarla |
|-------|-----------------|
| `prisma-database-setup` | Edita `schema.prisma`, migraciones, `prisma migrate`, `prisma generate`, `seed`. |
| `prisma-postgres` | Postgres específico: `JSONB`, MVs (`_mv_*`), `SET LOCAL search_path`, índices partial/BRIN, schemas tenant. |
| `stripe-best-practices` | Cualquier cosa con Stripe: Checkout, Customer Portal, webhooks, planes Starter/Growth/Pro, idempotencia de eventos. |
| `nestjs-best-practices` | Casos de uso NestJS: guards, interceptors, módulos, DI, pipes, ExceptionFilter. Especialmente al tocar `app.module.ts` o añadir un módulo nuevo. |
| `sentry-nestjs-sdk` | Setup / uso de Sentry en la API (`Sentry.init`, `@Sentry.ExceptionCapturer`, beforeSend, performance). |

**Reglas:**

- Si tu tarea encaja con una skill → consulta su `SKILL.md` antes de escribir código. Aplica sus patrones y nomenclatura.
- Las skills son PromptScripts: solo instrucciones, no ejecutan nada. Tú decides si las sigues.
- Si una skill contradice a `PLAN-MVP-POS-SAAS.md` o a este `AGENTS.md`, **prioridad**: `AGENTS.md` > `PLAN-MVP-POS-SAAS.md` > skill. Documenta la razón en el commit.
- Para añadir/actualizar skills: `npx skills add <owner/repo@name> -y` (instalación local, no `-g` — estas skills son PromptScript y no soportan global).

## Línea de comprobación rápida

Si dudas si algo está permitido:

1. ¿Está en `PLAN-MVP-POS-SAAS.md`? → sigue el plan.
2. ¿Es contrario al plan? → pregunta antes de desviarte.
3. ¿No está cubierto? → elige el camino que mantenga modularidad DDD-lite, multi-tenant implícito y sin SP.
