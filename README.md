# POS SaaS — MVP

SaaS multi-tenant de Punto de Venta (POS) cloud-first, multi-sucursal. MVP enfocado en comercios minoristas de América Latina.

## Módulos del MVP

- **Catálogo** — productos, variantes, categorías, import CSV
- **Códigos** — generación on-the-fly de barcode (EAN-13, Code128) y QR
- **Inventarios** — stock por sucursal, movimientos auditados, transferencias
- **Compras** — proveedores, órdenes de compra, recepción
- **Ventas (POS)** — PWA offline-first, carrito, multi-pago, devoluciones
- **Caja** — apertura/cierre, arqueo, corte Z
- **Clientes** — CRM ligero, crédito de tienda
- **Reportes** — MVs materializadas + exports
- **Billing** — Stripe, planes Starter/Growth/Pro
- **Auth** — JWT + RBAC multi-tenant

## Stack

- **Monorepo** — pnpm workspaces + Turborepo
- **API** — NestJS (Fastify) + Prisma + PostgreSQL (schema-per-tenant)
- **Web / POS** — Next.js 15 (App Router) + Tailwind + PWA (Dexie)
- **Workers** — BullMQ (Redis) para MVs, exports y emails
- **Storage** — Cloudinary (abstraído tras `StorageProvider`)
- **Pagos** — Stripe (suscripción SaaS)
- **Tooling** — Biome (lint/format), Vitest, Playwright

## Setup rápido

```bash
# Requisitos: Node 20+, pnpm 9+, Docker
pnpm install
cp .env.example .env
pnpm docker:up        # Postgres + Redis + Mailhog
pnpm --filter @pos/api prisma:migrate
pnpm dev              # API :3000 + web :3001 simultáneo
```

## Comandos principales

```bash
pnpm dev              # arranca todos los apps en paralelo (turbo)
pnpm build            # build de todos los packages/apps
pnpm typecheck        # tsc --noEmit en todo el workspace
pnpm lint             # Biome check
pnpm test             # Vitest en todo el workspace
pnpm test:e2e         # Playwright en apps/web
pnpm db:migrate       # migraciones Prisma (base)
pnpm db:seed          # seeders base
pnpm --filter @pos/api prisma:studio   # explorar DB
```

## Estructura

```text
.
├── apps/
│   ├── api/                 # NestJS backend (modular monolith, 14 módulos)
│   └── web/                 # Next.js 15 (landing + dashboard + POS PWA)
├── workers/
│   ├── reports-worker/      # refresh MVs + exports
│   └── notifications-worker/ # emails transaccionales
├── packages/
│   ├── types/               # tipos y enums compartidos
│   ├── storage/             # StorageProvider interface + impl Cloudinary
│   └── ui/                  # design system (placeholder)
├── PLAN-MVP-POS-SAAS.md     # documento maestro del plan
└── AGENTS.md                # instrucciones para sesiones OpenCode
```

## Documentación

- **`PLAN-MVP-POS-SAAS.md`** — plan maestro: arquitectura, modelo de datos, módulos, roadmap, decisiones técnicas (SP, Cloudinary, MVs), riesgos, KPIs.
- **`AGENTS.md`** — convenciones de trabajo para agentes automatizados.

## Estado

Pre-Sprint 0 — esqueleto de carpetas y configuración base completos. Lista para arrancar Sprint 1 (Foundation: multi-tenant + auth + onboarding).
