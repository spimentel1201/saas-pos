# Plan de Desarrollo — MVP SaaS POS (Punto de Venta)

> Documento maestro del MVP. Incluye arquitectura, modelo de datos, módulos, roadmap, decisiones técnicas (stored procedures, almacenamiento de imágenes), riesgos, KPIs y criterios de lanzamiento.

---

## Tabla de contenidos

1. [Visión y alcance](#1-visión-y-alcance-del-mvp)
2. [Stack tecnológico](#2-stack-tecnológico-recomendado)
3. [Arquitectura](#3-arquitectura)
4. [Arquitectura del backend](#4-arquitectura-del-backend)
5. [Modelo de datos core](#5-modelo-de-datos-core-simplificado)
6. [Módulos del MVP](#6-módulos-del-mvp)
7. [Roles y permisos (RBAC)](#7-roles-y-permisos-rbac)
8. [Roadmap por sprints](#8-roadmap-por-sprints-semanas)
9. [Decisión técnica: procedimientos almacenados](#9-decisión-técnica-procedimientos-almacenados)
10. [Decisión técnica: almacenamiento de imágenes (Cloudinary)](#10-decisión-técnica-almacenamiento-de-imágenes-cloudinary)
11. [Materialized views para reportes](#11-materialized-views-para-reportes)
12. [Contrato del StorageProvider](#12-contrato-del-storageprovider)
13. [Riesgos y mitigaciones](#13-riesgos-y-mitigaciones)
14. [KPIs del MVP](#14-kpis-del-mvp)
15. [Criterios de "listo para beta"](#15-criterios-de-listo-para-beta)
16. [Fuera del MVP (v2+)](#16-fuera-del-mvp-v2)
17. [Entregables finales](#17-entregables-finales-del-mvp)

---

## 1. Visión y alcance del MVP

SaaS multi-tenant de POS cloud-first, multi-sucursal, con módulos base enfocados en operación de comercios minoristas: inventario, ventas, compras, caja, reportes y generación de códigos de barra/QR por producto.

**Objetivos del MVP (3–4 meses):**

- Onboarding self-service de comercios (signup → primera venta < 15 min)
- Operación de caja offline-first con sincronización
- Cobertura de flujo end-to-end: compra → inventario → venta → reporte
- Modelo freemium simple para validar pricing

---

## 2. Stack tecnológico recomendado

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend web | Next.js (App Router) + TypeScript + Tailwind | SSR, RSC, SEO de landing, ecosistema |
| Frontend POS | PWA desde el mismo Next.js con service worker (offline) | Una sola codebase |
| Backend | NestJS (TypeScript) + Prisma ORM | Modular, tipado, modular monolith |
| Base de datos | PostgreSQL (multi-tenant schema-per-tenant) | Madurez, JSONB, replicated reads |
| Cola / tareas | Redis + BullMQ | Reportes, sync offline, emails |
| Auth | Better Auth / Lucia + JWT | Multi-tenant RBAC |
| Pagos | Stripe (suscripción SaaS) + MercadoPago/Stripe Terminal (POS) | América Latina |
| Storage | Cloudinary (MVP) → adapter a R2/S3 (v2) | Transformaciones on-the-fly + CDN |
| Infra | Docker Compose (dev) → Fly.io / Railway / Render (prod) | Iteración rápida |
| Observabilidad | Sentry + OpenTelemetry + Posthog | Errores + producto |
| Reportes | Materialized views + exports CSV/Excel/PDF | BI ligero |
| i18n | next-intl | es-MX base, es-CO/AR/CL/ES, pt-BR, en |

---

## 3. Arquitectura

### 3.1 Multi-tenancy

- **Estrategia:** schema-per-tenant en PostgreSQL (aislamiento + migración simple).
- **Tenant resolver:** por subdomain (`acme.posapp.com`) o dominio custom.
- **Tablas compartidas** (schema `public`): `tenants`, `users`, `subscriptions`, `tenants_users` (roles globales).
- **Esquema tenant** (`tenant_<id>`): `branches`, `products`, `inventory`, `sales`, `purchases`, `cash_sessions`, `users_tenants` (roles dentro del tenant).

### 3.2 Modular monolith

Módulos NestJS independientes con eventos internos (EventEmitter):

- `auth`, `tenants`, `users`, `billing`
- `catalog` (productos, variantes, categorías, códigos)
- `inventory` (stock, movimientos, transferencias)
- `purchasing` (proveedores, órdenes de compra, recepción)
- `sales` (carrito, checkout, devoluciones)
- `cash` (apertura/cierre, movimientos, arqueo)
- `reports` (agregaciones, exports)
- `codes` (barcode/QR generation)
- `notifications` (email/whatsapp plantillas)

### 3.3 Offline-first POS

- **Service Worker** con IndexedDB (Dexie) replica catálogo + últimos 7 días de ventas.
- **Cola local** de mutations → sync cuando online.
- **IDs ULID** generados en el cliente para evitar colisión.
- **Conflict resolution:** last-write-wins + server-authoritative stock (lock optimista por producto con `version` o `updated_at`).

---

## 4. Arquitectura del backend

### 4.1 Patrón arquitectónico

**Modular Monolith** — un solo deployable con módulos internos independientes y fronteras claras. Punto óptimo para MVP SaaS: simplicidad operativa del monolito + mantenibilidad del diseño modular.

**Por qué NO microservicios en el MVP:**

| Criterio | Microservicios | Modular Monolith |
|----------|----------------|------------------|
| Complejidad operativa | alta (service mesh, tracing distribuido) | baja (un proceso, un deploy) |
| Latencia inter-servicio | red | llamada en proceso |
| Transacciones distribuidas | saga / outbox | transacción DB local |
| Costo de infra | N× servicios | un proceso |
| Migración futura a microservicios | — | fácil (módulos ya aislados) |

Si un módulo (`reports`, `billing`) crece y justifica extraerse, es un refactor contenido — no un rewrite.

### 4.2 Capas dentro de cada módulo (DDD-lite)

Cada módulo NestJS sigue DDD pragmático con 4 capas:

```text
src/modules/<module>/
├── domain/             # Entidades, value objects, reglas de negocio puras (sin framework)
│   ├── entities/
│   ├── value-objects/
│   └── errors/
├── application/        # Casos de uso, DTOs, orquestación
│   ├── use-cases/
│   ├── services/
│   └── dtos/
├── infrastructure/     # Adaptadores externos
│   ├── repositories/   # impl Prisma de interfaces de domain
│   ├── http/           # controllers NestJS
│   ├── events/         # handlers de eventos internos
│   └── external/       # Cloudinary, Stripe, etc.
└── <module>.module.ts  # wiring DI de NestJS
```

**Regla de dependencias:**

```text
domain  ←  application  ←  infrastructure  ←  http/external
 (puro)     (casos uso)     (adaptadores)        (framework)
```

- `domain` no importa nada de NestJS ni Prisma (solo TypeScript).
- `application` depende de interfaces (puertos) declaradas en `domain`.
- `infrastructure` implementa esos puertos con Prisma / Cloudinary / Stripe.
- Permite testear casos de uso sin DB ni framework.

### 4.3 Comunicación inter-módulos

Tres mecanismos, en orden de preferencia:

1. **Llamada directa a Application Service** (DI NestJS) — para dependencias síncronas (`SalesService` valida stock llamando `InventoryService.checkAvailability`).
2. **EventEmitter interno** (`@nestjs/event-emitter`) — para desacoplar side effects (`SaleCompleted` → `InventoryMovement`, `Notification`, `ReportsJob`).
3. **BullMQ jobs (Redis)** — para tareas async reales (refresh MVs, emails, exports largos).

No hay broker de mensajes entre procesos (RabbitMQ/Kafka) en el MVP — sobra con EventEmitter + BullMQ.

### 4.4 API surface

```text
REST          /api/v1/...        → operaciones CRUD + transaccionales
WebSocket     /ws                → solo POS (sync status, multi-cajero en vivo)
BullMQ workers (proceso separado)
  ├── reports.refresh-mv
  ├── notifications.email
  └── exports.generate
```

GraphQL queda fuera del MVP (añade complejidad innecesaria).

### 4.5 Cross-cutting concerns

| Concern | Mecanismo |
|---------|-----------|
| Multi-tenant | Middleware + Prisma extension que setea `search_path` por request |
| AuthN | JWT (access + refresh) vía Better Auth / Lucia |
| AuthZ | Guards NestJS + `@Roles()` + policy por módulo |
| Validación | `class-validator` + Zod en DTOs de input |
| Errores | Filtros globales → RFC7807 Problem Details |
| Logging | pino + correlation IDs por request |
| Tracing | OpenTelemetry SDK auto-instrumentado |
| Rate limit | NestJS throttle guard (por tenant + IP) |
| Transacciones | Prisma `$transaction` explícita en casos críticos (venta, cierre caja, recepción compra) |
| Idempotencia | Middleware `Idempotency-Key` + tabla `idempotency_records` |
| Auditoría | Tabla `audit_log` escrita por interceptor (writes sensibles) |

### 4.6 Módulos NestJS del MVP

```text
auth            signup multi-tenant, JWT, refresh, invites
tenants         lifecycle, plan limits, usage counters
users           RBAC, invitations
billing         Stripe subscriptions, webhooks, customer portal
catalog         products, variants, categories, CSV import
inventory       stock, movements, transfers, alerts
purchasing      suppliers, PO, receipts (actualiza costo + stock)
sales           carrito, checkout, devoluciones, sequence numbers
cash            sessions, movimientos, arqueo, corte Z
customers       CRUD, crédito, historial
reports         lee MVs, builders, exports, scheduled emails
codes           generación barcode/QR + plantillas etiqueta
storage         fachada StorageProvider (Cloudinary)
notifications   plantillas email (react-email) + BullMQ
```

### 4.7 Ejemplo de wiring de un módulo

```typescript
// modules/sales/sales.module.ts
@Module({
  imports: [CqrsModule, EventEmitterModule],
  controllers: [SalesController],
  providers: [
    // application
    CreateSaleUseCase,
    ReturnSaleUseCase,
    SalesQueryService,
    // infrastructure
    { provide: 'SalesRepository', useClass: PrismaSalesRepository },
    { provide: 'InventoryPort', useExisting: InventoryService },
    // events
    SaleCompletedHandler,
  ],
  exports: ['SalesRepository', SalesQueryService],
})
export class SalesModule {}
```

### 4.8 Trade-offs asumidos

| Decisión | Trade-off |
|----------|-----------|
| Monolito modular vs microservicios | pierdes aislamiento de fallos, ganas velocidad de entrega |
| Prisma vs SQL crudo + SP | pierdes velocidad de queries específicas, ganas DX + type-safety |
| DDD-lite vs CRUD plano | más carpetas iniciales, menos deuda técnica al crecer |
| Schema-per-tenant vs row-level security | más schemas para migrar, mejor aislamiento + depuración |
| EventEmitter interno vs broker | pierdes escalado selectivo de módulos, ganas simplicidad operativa |

---

## 5. Modelo de datos core (simplificado)

```text
-- SHARED SCHEMA (public)
tenants(id, name, plan, status, created_at)
users(id, email, password_hash, name)
tenants_users(tenant_id, user_id, role)        -- owner | admin | manager | cashier
branches(id, tenant_id, name, code)            -- shared para resolucion, metadata
subscriptions(id, tenant_id, plan, stripe_id, status, current_period_end)
usage_counters(id, tenant_id, branch_count, product_count, sale_count, period)
audit_log(id, tenant_id, user_id, action, entity, entity_id, changes, ip, user_agent)

-- TENANT SCHEMA
branches_tenant(id UUID, name, code, address, city, timezone, active)
taxes(id, name, rate, type)                    -- IVA 16%, exento, etc.
tenant_settings(id, key, value JSONB)          -- currency, timezone, ticket_header, etc.

products(id, sku, barcode, name, description, category_id,
         cost, price, tax_id, type, track_stock, active,
         image_public_id, image_url)
product_variants(id, product_id, sku, barcode, attributes JSONB)
categories(id, name, parent_id)

customers(id UUID, name, email, phone, type, document_type, document_number,
          address, city, state, zip_code, tax_id, credit_balance, notes,
          active, created_by, created_at, updated_at)
  -- type: INDIVIDUAL | BUSINESS
  -- document_type: DNI | RUC | CE | PASSPORT

inventory_stocks(id, branch_id UUID, product_id, qty, reserved, min, max, avg_cost, version)
inventory_movements(id, stock_id, type, delta, reason, ref, branch_id UUID, user_id, created_at)
  -- type: purchase | sale | adjustment | transfer | return | loss
stock_transfers(id, from_branch_id UUID, to_branch_id UUID, status, items JSONB)

suppliers(id, name, contact, tax_id, email, phone)
purchase_orders(id, branch_id UUID, supplier_id, status, total, items JSONB)
purchase_receipts(id, po_id, received_at, received_by, items JSONB)

sales(id, branch_id UUID, user_id, cashier_session_id, number_seq,
      customer_id UUID, subtotal, tax, discount, total, status, meta, created_at)
sale_items(id, sale_id, product_id, variant_id, qty, unit_price, tax_amount, discount, total)
sale_payments(id, sale_id, method, amount, ref)
returns(id, sale_id, reason, items JSONB, total)

cash_sessions(id, branch_id UUID, user_id, opened_at, closed_at,
              opening_balance, expected_balance, counted_balance, difference, status)
cash_movements(id, session_id, type, amount, reason)

-- MATERIALIZED VIEWS
_mv_sales_daily(branch_id, day, product_id, sales_count, qty_sold, gross_total, gross_profit)
_mv_inventory_valuation(branch_id, product_id, qty, avg_cost, valuation)
_mv_sales_by_category(branch_id, day, category_id, gross_total, gross_profit, qty_sold)
_mv_cash_summary(branch_id, day, session_count, total_opening, total_expected, total_counted, total_difference)
```

**Notas:**

- `branches` existe en shared (para resolucion) y en tenant schema (para datos completos con UUID).
- `branch_id UUID` en todas las tablas tenant (reemplaza `branch_code text` del MVP original).
- `customers` soporta INDIVIDUAL/BUSINESS con DNI/RUC para Peru.
- `tenant_settings` almacena configuracion flexible (currency, timezone, ticket_header, etc.).
- `audit_log` en shared schema para trazabilidad de cambios en configuracion.
- `version` en `inventory_stocks` para lock optimista en operaciones concurrentes.
- `number_seq` en `sales` debe ser secuencial por sucursal y por día.

---

## 6. Módulos del MVP

### Módulo A — Onboarding y Auth

- Signup tenant + primer usuario (owner)
- Confirmación email, recuperación password
- RBAC: owner / admin / manager / cashier
- Invitaciones por email
- Límites por plan (branches, products, ventas/mes)

### Módulo B — Catálogo y Productos

- CRUD productos, variantes, categorías
- Importación masiva CSV / Excel
- SKU auto-generado configurable
- Subir imágenes a Cloudinary (unsigned upload firmado por backend)
- Precio por sucursal opcional

### Módulo C — Códigos de Barra y QR

- Generación on-the-fly de **Code128 / EAN-13 / EAN-8 / UPC-A / QR** en backend (lib `bwip-js` + `qrcode`).
- Endpoint: `GET /api/products/:id/code?type=ean13|qr|code128&size=large` → PNG/SVG buffer.
- Imprimir etiquetas en lote (página A4 / rollo thermos) vía plantilla HTML → PDF.
- Validación de check digit EAN-13 al asignar barcode manual.
- **QR contiene:** producto ID + URL pública firmada con HMAC (`https://{tenant}.posapp.com/p/:slug?sig=...`) para prevenir spoofing.

### Módulo D — Inventarios

- Stock por sucursal, mínimos / máximos
- Movimientos auditable (razón, usuario, ref)
- Ajustes de stock (conteo cíclico)
- Transferencias entre sucursales (petición → envío → recepción)
- Alertas de stock mínimo (email + dashboard)

### Módulo E — Compras

- CRUD proveedores
- Órdenes de compra (borrador → enviada → parcial → recibida → cancelada)
- Recepción parcial incrementa inventario automáticamente
- Costo promedio ponderado al recibir

### Módulo F — Ventas (POS)

- PWA: búsqueda rápida, escáner de código, atajos de teclado
- Carrito, descuentos por ítem / generales
- Múltiples pagos (efectivo, tarjeta, transferencia, crédito cliente)
- Devoluciones y notas de crédito
- Bloqueo de caja por sesión, venta suspendida / recall
- Impresión de ticket vía WebUSB / Bluetooth (ESC/POS) o fallback PDF

### Módulo G — Caja

- Apertura con saldo inicial
- Entradas / salidas de efectivo con motivo
- Cierre con arqueo (contado vs esperado → diferencia)
- Corte Z diario por sucursal
- Vinculación de ventas por sesión

### Módulo H — Clientes (CRM ligero) ✅ IMPLEMENTADO

- CRUD clientes con validación DNI/RUC para Peru
- Tipos: INDIVIDUAL (DNI) / BUSINESS (RUC)
- Búsqueda rápida para POS: nombre, teléfono, email, DNI, RUC
- Crédito de tienda (monedero) con ajuste
- Historial de compras por cliente
- Soft delete (desactivar)

### Módulo I — Reportes ✅ IMPLEMENTADO

- Ventas por día / sucursal / producto / categoría
- Inventario valorizado (costo promedio)
- Reporte de caja y diferencias
- Export Excel con plantillas personalizadas (colores, formato)
- Dashboard home (KPIs: ventas hoy, ticket promedio, stock crítico)
- Heatmap de ventas por hora
- Materialized views refresh cada hora (BullMQ)
- Hybrid approach: MVs para histórico + live query para hoy

### Módulo J — Suscripción y Billing

- **Planes:** Starter (1 branch, 200 productos), Growth (≤5 branches, productos ilimitados), Pro (multi-sucursal + API)
- Stripe Checkout + Customer Portal
- Trials 14 días
- Downgrade con gracia (read-only al expirar)

### Módulo K — Configuración ✅ IMPLEMENTADO

- Sucursales CRUD (UUID, código inmutable, timezone por branch)
- Impuestos CRUD (PERCENT, EXEMPT, FIXED)
- Configuración tenant: currency, timezone, ticket_header, ticket_footer, brand_color
- Ticket header personalizable (nombre negocio, logo, dirección, teléfono)
- Usuarios y roles con RBAC (@Roles decorator + RolesGuard)
- Auditoría de cambios (@Audit decorator → audit_log)
- Integraciones: hardware de impresora, webhooks (pendiente)

---

## 7. Roles y permisos (RBAC) ✅ IMPLEMENTADO

| Acción | OWNER | ADMIN | MANAGER | CASHIER |
|--------|:-----:|:-----:|:-------:|:-------:|
| Ver dashboard | ✅ | ✅ | ✅ | ✅ |
| Operar POS | ✅ | ✅ | ✅ | ✅ |
| Caja (abrir/cerrar) | ✅ | ✅ | ✅ | ✅ |
| Gestión productos | ✅ | ✅ | ✅ | ❌ |
| Compras / proveedores | ✅ | ✅ | ✅ | ❌ |
| Transferencias inventario | ✅ | ✅ | ✅ | ❌ |
| Ver historial clientes | ✅ | ✅ | ✅ | ✅ |
| Editar crédito clientes | ✅ | ✅ | ❌ | ❌ |
| Reportes | ✅ | ✅ | ✅ | ❌ |
| Configuración tenant | ✅ | ✅ | ❌ | ❌ |
| Gestión usuarios | ✅ | ✅ | ❌ | ❌ |
| Billing | ✅ | ❌ | ❌ | ❌ |

**Implementación:** `@Roles()` decorator + `RolesGuard` (NestJS guard). Roles en JWT payload verificados server-side.

---

## 8. Roadmap por sprints (semanas)

### Sprint 0 — Setup (sem 1)

- Monorepo (Turborepo o Nx): `apps/web`, `apps/api`, `packages/ui`, `packages/types`
- Docker compose: Postgres + Redis + Mailhog
- CI GitHub Actions: lint, typecheck, test, build
- Pre-commit: Biome
- i18n setup inicial (es-MX base)

### Sprint 1 — Foundation (sem 2–3)

- Multi-tenant schema + migrations automatizadas (Prisma migrate + script `tenants.create`)
- Auth + RBAC + invitations
- Onboarding wizard: tenant → primera sucursal → moneda/impuesto → primer producto
- Landing + pricing + signup
- Stripe suscripción + trials

### Sprint 2 — Catálogo + Códigos (sem 4–5)

- CRUD productos / variantes / categorías
- Import CSV
- Generación barcode (Code128/EAN) + QR (endpoint + UI)
- Plantilla de impresión de etiquetas (PDF)
- Búsqueda avanzada, filtros

### Sprint 3 — Inventario + Compras (sem 6–7)

- Stock por sucursal, movimientos auditados
- Ajustes y transferencias
- Proveedores y órdenes de compra
- Recepción → recálculo costo promedio
- Alertas de mínimos por email

### Sprint 4 — POS + Caja (sem 8–10)

- UI POS PWA con IndexedDB
- Carrito, descuentos, multi-pago
- Devoluciones / notas de crédito
- Apertura / cierre de caja + arqueo
- Impresión ticket (ESC/POS + fallback PDF)
- Sincronización offline: conflictos, dedup ID

### Sprint 5 — Reportes + Dashboard (sem 11–12)

- Materialized views (refresh hourly) en `_mv_*`
- Dashboard home
- Builder de reportes + exports
- Scheduled exports por email (plan Pro)

### Sprint 6 — Hardening + launch beta (sem 13–14)

- Testing E2E (Playwright): flows críticos
- Load testing (k6) endpoint POS sync
- Seguridad: rate-limit, OWASP review, backups
- Observabilidad + alertas
- Beta privada 10–20 comercios

### Sprint 7 — Feedback + iteración (sem 15–16)

- Bug fixes prioritarios
- Onboarding mejorado basado en telemetría
- Documentación de ayuda in-app
- Prep launch público

---

## 9. Decisión técnica: procedimientos almacenados

**Decisión:** NO usar stored procedures como regla general para el MVP. Justificación:

### Comparación

| Factor | Stored Procedures | Prisma / ORM |
|--------|------------------|--------------|
| Velocidad bruta | ✅ sí | similar con queries bien hechas |
| Testing / migraciones | ❌ dolor (no type-safe, no en git) | ✅ tipado + revisión |
| Multi-tenant | difícil aislar lógica por schema | trivial con middleware |
| Cambios / iteración | migration + deploy DB | deploy app |
| Observabilidad (OTel traces) | opaca | traces completos |
| Talento disponible | especialista SQL raro | TS común |
| Versionado de schema | custom (pg_TAP/Bytebase) | Prisma migrate estándar |

### Cuándo SÍ usar stored procedures (casos medidos)

- **Reports agregados muy pesados** (millones de filas): una **materialized view + refresh job** gana 100–1000x vs query en vivo, y suele ser mejor que un SP.
- **Operaciones atómicas críticas** como cierre de caja con `SELECT FOR UPDATE` sobre `cash_session`: pueden hacerse con Prisma + transacción del módulo sin SP, sin diferencia significativa.

### Lo que de verdad escala las consultas grandes (no es SP)

1. **Índices correctos:** composite + partial + BRIN en columnas temporales
2. **Materialized views** para agregaciones (`_mv_sales_daily`, `_mv_inventory_valuation`)
3. **Read replicas** para reportes (libera el primary del POS)
4. **Paginación con cursor** en listings grandes
5. **Background jobs** para cálculos pesados (BullMQ)
6. **Particionamiento** de `sales` por mes cuando pase de ~50M filas

### Razonamiento clave

Para el volumen objetivo del MVP (cientos de comercios, miles / millones de ventas/mes) con buen indexing + MVs **no se observa ganancia medible con SP**. El cuello de botella real será el N+1 accidental del ORM, no la falta de SP.

**Recomendación final:** ORM con Prisma + transacciones explícitas + MVs + (luego) read replicas. Solo introducir SP si se mide un problema y no hay alternativa — y en ese caso casi siempre MV gana.

---

## 10. Decisión técnica: almacenamiento de imágenes (Cloudinary)

**Decisión:** usar Cloudinary para el MVP, abstraído tras un `StorageProvider` interface.

### Ventajas

| Ventaja | Detalle |
|---------|---------|
| Transformaciones on-the-fly | `w_300,h_300,c_fill/q_auto,f_auto` — no generas variantes en backend |
| CDN global incluido | latencia baja en Latam |
| Upload unsigned desde frontend | reduce carga de tu API y del backend |
| Optimización automática (`q_auto`, `f_auto`) | webp/avif automático según browser |
| Moderación AI opcional | útil si permites upload de clientes |
| QR/Barcode generado en backend | guardado como PNG/SVG con transform params |

### Caveats a tener en cuenta

1. **Costo:** plan free = 25 créditos/mes. Comercio con 1000 productos × 3 variantes = 3000 archivos. En producción necesitas plan paid (~$89+/mo base + overages).
2. **Vendor lock-in:** abstraer tras `StorageProvider` (`upload`, `url`, `delete`, `transform`). Implementación Cloudinary primero, puerta abierta a R2/S3 en v2 sin tocar código de negocio.
3. **Multi-tenant:** usar prefijo en `public_id` `tenants/{tenantId}/products/{id}`. Cloudinary no tiene aislamiento real — todo es un pool.
4. **Backups:** Cloudinary no promete backup permanente garantizado para entradas billing-critical (logos). Sincronizar copia a R2/Backblaze B2 (~$0.005/GB) si conviene.
5. **QR/Barcode generado en backend:** encriptar / firmar el payload del QR (producto ID firmado con HMAC) para evitar spoofing de URL pública.
6. **Límites de upload:** 10 MB por upload default. Imágenes de producto JPG ~500KB — bien. Logos también.
7. **Rate limiting de upload:** plan free limita x req/min; throttlear frontend y job de migración.

### Flujo de upload recomendado

1. Frontend pide al backend un **signed upload params** (endpoint `POST /api/uploads/sign`).
2. Backend devuelve signature + preset + `public_id` sugerido (`tenants/{tid}/products/{pid}`).
3. Frontend hace **upload directo a Cloudinary** (no pasa por tu API).
4. Frontend recibe `public_id` + `secure_url` → lo envía al backend en el save del producto.
5. Backend persiste `image_public_id` y `image_url` en la tabla `products`.
6. Para mostrar, backend genera URL optimizada vía `StorageProvider.optimizedUrl(publicId, transform)`.

**Beneficio:** la imagen nunca pesa en tu API, ancho de banda ni latencia.

---

## 11. Materialized views para reportes

Estrategia para reportes agregados sin stored procedures ni queries en vivo costosas.

### MVs propuestas

```sql
-- Ventas diarias por sucursal / producto / categoría
CREATE MATERIALIZED VIEW _mv_sales_daily AS
SELECT
  tenant_id,
  branch_id,
  date_trunc('day', s.created_at) AS day,
  p.category_id,
  si.product_id,
  count(*)                   AS sales_count,
  sum(si.qty)                AS qty_sold,
  sum(si.total)              AS gross_total,
  sum(si.total - si.qty * p.cost) AS gross_profit
FROM sales s
JOIN sale_items si ON si.sale_id = s.id
JOIN products p    ON p.id = si.product_id
WHERE s.status = 'completed'
GROUP BY 1,2,3,4,5;

CREATE UNIQUE INDEX ON _mv_sales_daily (tenant_id, branch_id, day, product_id);

-- Inventario valorizado por sucursal
CREATE MATERIALIZED VIEW _mv_inventory_valuation AS
SELECT
  tenant_id,
  branch_id,
  product_id,
  qty,
  qty * avg_cost AS valuation
FROM inventory_stocks
JOIN products ON products.id = inventory_stocks.product_id;

CREATE UNIQUE INDEX ON _mv_inventory_valuation (branch_id, product_id);
```

### Refresh strategy

- **REFRESH COMPLETE** cada hora (BullMQ job `mv.refresh`).
- **REFRESH CONCURRENTLY** para no bloquear lecturas (requiere unique index).
- Reportes leen de las MVs → respuesta O(1) sin importar volumen histórico.
- Ventas del día actual pueden leer de `sales` directo para frescura (small dataset).

### Indexación complementaria

```sql
-- Para drill-down por rango de fechas
CREATE INDEX idx_sales_created ON sales (tenant_id, branch_id, created_at DESC);
-- Para filtrar por status
CREATE INDEX idx_sales_status ON sales (tenant_id, status) WHERE status = 'completed';
-- BRIN en columnas temporales grandes (barato en disco)
CREATE INDEX idx_sales_created_brin ON sales USING BRIN (created_at);
```

---

## 12. Contrato del StorageProvider

Interface que abstrae Cloudinary (y cualquier futuro provider: R2, S3, Backblaze B2).

```typescript
// packages/types/src/storage.ts

export interface StorageProvider {
  /**
   * Sube un buffer al storage. Usado por backend para QR/barcode generados.
   */
  upload(buffer: Buffer, opts: UploadOpts): Promise<UploadResult>;

  /**
   * Devuelve URL optimizada con transformaciones aplicadas.
   * Para Cloudinary genera URL con transform params (w,h,c,q,f, ...).
   */
  optimizedUrl(publicId: string, transform: TransformOpts): string;

  /**
   * URL original (sin transformar).
   */
  rawUrl(publicId: string): string;

  /**
   * Elimina un asset por public_id.
   */
  delete(publicId: string): Promise<void>;

  /**
   * Genera parámetros firmados para upload directo desde el frontend.
   * El backend no recibe el archivo, solo la firma.
   */
  signedUploadParams(opts: SignOpts): SignedUpload;
}

export interface UploadOpts {
  publicId: string;        // ej: "tenants/123/products/456"
  contentType: string;     // mime
  tags?: string[];
  folder?: string;
}

export interface UploadResult {
  publicId: string;
  url: string;
  bytes: number;
  format: string;
}

export interface TransformOpts {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'limit';
  quality?: 'auto' | number;     // 'auto' = q_auto en Cloudinary
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  gravity?: 'face' | 'center' | 'auto';
}

export interface SignOpts {
  folder: string;          // ej: "tenants/123/products"
  tags?: string[];
  maxBytes?: number;       // límite de tamaño
}

export interface SignedUpload {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  preset: string;          // upload preset unsigned
}

// packages/storage/src/cloudinary.provider.ts
// implements StorageProvider sobre cloudinary npm package.

// packages/storage/src/r2.provider.ts  (v2)
```

### Endpoints de API

```
POST   /api/uploads/sign              -> SignedUpload (body: { folder, tags })
GET    /api/products/:id/code?type=qr  -> PNG buffer desde StorageProvider
DELETE /api/uploads/:publicId         -> solo owner/admin del tenant
```

### Reglas de nomenclatura de `public_id`

- Productos: `tenants/{tenantId}/products/{productId}`
- Variantes: `tenants/{tenantId}/products/{productId}/variants/{variantId}`
- Logo del tenant: `tenants/{tenantId}/logo`
- QR/Barcode generado: `tenants/{tenantId}/codes/{type}/{productId}`

---

## 13. Riesgos y mitigaciones

| Riesgo | Prob | Impacto | Mitigación |
|--------|:----:|:-------:|------------|
| Offline sync conflictivo | Alta | Alto | ULID cliente, server-authoritative stock, replay log UI |
| Lentitud de reportes con datos grandes | Media | Alto | MVs materializadas + jobs, indexación JSONB |
| Impresoras ESC/POS variadas | Alta | Medio | Docs + lista de dispositivos probados; fallback PDF |
| Migración schema multi-tenant | Media | Alto | Migración por tenant con lock + dry-run automatizado |
| Cumplimiento fiscal por país | Media | Alto | MVP no factura electrónica; preview v2 (MX/COL/AR) |
| Costos cloud por tenant | Baja | Medio | Schema-per-tenant + shared tables en public |
| Evasión de límites del plan | Media | Medio | Contadores en `usage_counters` + middleware de cuota |
| Pérdida de datos de un tenant | Baja | Crítico | Backup diario automatizado + restore verificado mensual |
| Costo Cloudinary en producción | Media | Medio | Monitoreo de overages + throttle + plande migración a R2 |

---

## 14. KPIs del MVP

- **Activación:** % de tenants que hacen la primera venta < 24h → meta 60%
- **Retención D30:** 40% (beta)
- **Time-to-first-sale** mediana < 15 min
- **Ingresos MRR:** 10 clientes pagantes al final del MVP (beta privada)
- **NPS beta** > 30
- **Estabilidad:** < 1 bug crítico/semana post-launch en reporting o POS cashier
- **Disponibilidad:** 99.5% (ventanas aceptables fuera de horas pico)

---

## 15. Criterios de "listo para beta"

- ✅ Flujo signup → checkout Stripe → primera venta funciona E2E
- ✅ POS offline soporta 4h sin conexión y sincroniza correctamente
- ✅ Cierre de caja cuadra con ≤ 0.5% de error esperado en pruebas
- ✅ Etiquetas con barcode + QR imprimen correctamente en 3 modelos de impresora
- ✅ Reportes de ventas e inventario exportables
- ✅ Backup automático diario + restore verificado
- ✅ Suite E2E cubre 5 flujos críticos en CI

---

## 16. Fuera del MVP (v2+)

- Facturación electrónica (CFDI MX, e-invoice CO / AR / CL / PE)
- Recetas / kits de productos
- Programa de lealtad con puntos
- Marketplace de integraciones (Shopify, MercadoLibre)
- App móvil nativa (React Native / Flutter)
- BI avanzado y forecasting
- Multi-almacén con ubicaciones (racks)
- Contabilidad y asientos contables
- API pública + webhooks
- Roles granulares por sucursal
- Migración de Cloudinary → R2 para reducir costos (vía `StorageProvider`)
- Particionamiento de `sales` por mes
- Read replicas dedicadas para reporting

---

## 17. Entregables finales del MVP

1. Repositorio monorepo con CI/CD
2. App web desplegada (landing + app + POS)
3. API documentada (OpenAPI)
4. Base de datos con migraciones reversibles
5. Suite de tests (>60% líneas críticas)
5. Runbook de operaciones (deploys, backups, incidencias)
6. Documentación técnica + help center público
6. Panel admin interno (ops) para soporte a tenants
6. Demo data sandbox pública

---

*Documento generado como plan maestro del MVP. Actualizar conforme evolucione el alcance o las decisiones técnicas.*
