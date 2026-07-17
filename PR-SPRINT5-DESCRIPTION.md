# Sprint 5: Clientes, Usuarios + RBAC, Configuración y Reportes

## Resumen

Implementación completa de los módulos de Customers, Users + RBAC, Configuration y Reports siguiendo patrones DDD-lite con `TenantPrismaService.$queryRaw` y multi-tenant schema-per-tenant.

**Branch**: `feature/sprint5-customers-users-config-reports`  
**Commits**: `79357ce` - 72 archivos, +4344 líneas, -118 líneas  
**Status**: `pnpm lint` 0 errores/0 warnings, `pnpm typecheck` 0 errores

---

## Nuevos Módulos

### 1. Customers Module

| Endpoint | Método | Descripción | Auth |
|----------|--------|-------------|------|
| `api/v1/customers` | GET | Listar clientes (paginación, filtros) | `@TenantRequired()` |
| `api/v1/customers` | POST | Crear cliente (INDIVIDUAL/BUSINESS) | `@TenantRequired()` |
| `api/v1/customers/:id` | GET | Obtener cliente por ID | `@TenantRequired()` |
| `api/v1/customers/:id` | PATCH | Actualizar cliente | `@TenantRequired()` |
| `api/v1/customers/:id` | DELETE | Eliminar cliente (soft delete) | `@TenantRequired()` |
| `api/v1/customers/search` | GET | Búsqueda para POS (DNI/RUC, nombre, teléfono) | `@TenantRequired()` |
| `api/v1/customers/:id/credit` | POST | Ajustar crédito/monedero | `@TenantRequired()` |
| `api/v1/customers/:id/purchases` | GET | Historial de compras | `@TenantRequired()` |

**Características**:
- Tipos: `INDIVIDUAL`, `BUSINESS`
- Documentos: DNI (8 dígitos), RUC (11 dígitos), CE, PASSPORT
- Validación Perú específica
- Búsqueda por DNI/RUC para POS con ranking de relevancia
- Crédito/monedero por cliente

**Archivos**:
- `apps/api/src/modules/customers/domain/entities/customer.entity.ts`
- `apps/api/src/modules/customers/infrastructure/repositories/prisma-customer.repository.ts`
- `apps/api/src/modules/customers/infrastructure/http/customer.controller.ts`
- `apps/api/src/modules/customers/application/use-cases/customer.use-case.ts`
- `apps/api/src/modules/customers/customers.tokens.ts`
- `apps/api/src/modules/customers/customers.module.ts`

---

### 2. Users Module + RBAC

| Endpoint | Método | Descripción | Auth |
|----------|--------|-------------|------|
| `api/v1/users` | GET | Listar usuarios del tenant | `@Roles(ADMIN, OWNER)` |
| `api/v1/users/:id` | GET | Obtener usuario por ID | `@Roles(ADMIN, OWNER)` |
| `api/v1/users/:id/role` | PATCH | Actualizar rol del usuario | `@Roles(ADMIN, OWNER)` |
| `api/v1/users/:id` | DELETE | Eliminar usuario del tenant | `@Roles(OWNER)` |
| `api/v1/users/invite` | POST | Invitar usuario (email) | `@Roles(ADMIN, OWNER)` |

**RBAC Matrix**:
```
OWNER  > ADMIN > MANAGER > CASHIER
   ↓        ↓        ↓        ↓
 total    admin    manager  cashier
```

**Reglas de negocio**:
- Owners no pueden ser demovidos ni eliminados
- Usuarios no pueden asignar roles ≥ su propio nivel
- Solo OWNER puede eliminar usuarios
- Jerarquía: OWNER > ADMIN > MANAGER > CASHIER

**Archivos**:
- `apps/api/src/modules/users/domain/decorators/roles.decorator.ts` — `@Roles()`
- `apps/api/src/modules/users/domain/guards/roles.guard.ts` — `RolesGuard` (CanActivate)
- `apps/api/src/modules/users/infrastructure/repositories/prisma-user.repository.ts`
- `apps/api/src/modules/users/infrastructure/http/user.controller.ts`
- `apps/api/src/modules/users/application/use-cases/user.use-case.ts`
- `apps/api/src/modules/users/users.tokens.ts`
- `apps/api/src/modules/users/users.module.ts`

---

### 3. Configuration Module

| Endpoint | Método | Descripción | Auth |
|----------|--------|-------------|------|
| `api/v1/config/branches` | GET | Listar sucursales | `@TenantRequired()` |
| `api/v1/config/branches` | POST | Crear sucursal | `@TenantRequired()` |
| `api/v1/config/branches/:id` | GET | Obtener sucursal | `@TenantRequired()` |
| `api/v1/config/branches/:id` | PATCH | Actualizar sucursal | `@TenantRequired()` |
| `api/v1/config/branches/:id` | DELETE | Eliminar sucursal | `@TenantRequired()` |
| `api/v1/config/taxes` | GET | Listar impuestos | `@TenantRequired()` |
| `api/v1/config/taxes` | POST | Crear impuesto | `@TenantRequired()` |
| `api/v1/config/taxes/:id` | PATCH | Actualizar impuesto | `@TenantRequired()` |
| `api/v1/config/taxes/:id` | DELETE | Eliminar impuesto | `@TenantRequired()` |
| `api/v1/config/settings` | GET | Obtener settings del tenant | `@TenantRequired()` |
| `api/v1/config/settings` | PATCH | Actualizar settings | `@TenantRequired()` |
| `api/v1/config/settings/ticket-header` | GET | Obtener ticket header | `@TenantRequired()` |
| `api/v1/config/settings/ticket-header` | PATCH | Actualizar ticket header | `@TenantRequired()` |

**Características**:
- Sucursales con UUID (branch_id)
- Impuestos (IGV 18%, percepciones, retenciones)
- Settings per-tenant (JSONB): moneda, timezone, tax_included, ticket_header/footer
- `@Audit()` decorator para auditoría de cambios
- `AuditInterceptor` escribe a tabla `audit_log` (shared schema)

**Archivos**:
- `apps/api/src/modules/configuration/domain/decorators/audit.decorator.ts`
- `apps/api/src/modules/configuration/domain/interceptors/audit.interceptor.ts`
- `apps/api/src/modules/configuration/domain/entities/branch.entity.ts`
- `apps/api/src/modules/configuration/domain/entities/tax.entity.ts`
- `apps/api/src/modules/configuration/domain/entities/tenant-settings.entity.ts`
- `apps/api/src/modules/configuration/infrastructure/repositories/prisma-branch.repository.ts`
- `apps/api/src/modules/configuration/infrastructure/repositories/prisma-tax.repository.ts`
- `apps/api/src/modules/configuration/infrastructure/repositories/prisma-settings.repository.ts`
- `apps/api/src/modules/configuration/infrastructure/http/config.controller.ts`
- `apps/api/src/modules/configuration/application/use-cases/config.use-case.ts`
- `apps/api/src/modules/configuration/config.tokens.ts`
- `apps/api/src/modules/configuration/configuration.module.ts`

---

### 4. Reports Module

| Endpoint | Método | Descripción | Auth |
|----------|--------|-------------|------|
| `api/v1/reports/dashboard` | GET | KPIs del dashboard (ventas, ganancias, ticket promedio) | `@TenantRequired()` |
| `api/v1/reports/daily-sales` | GET | Ventas diarias (rango fechas) | `@TenantRequired()` |
| `api/v1/reports/product-sales` | GET | Ventas por producto | `@TenantRequired()` |
| `api/v1/reports/category-sales` | GET | Ventas por categoría | `@TenantRequired()` |
| `api/v1/reports/inventory-valuation` | GET | Valorización del inventario | `@TenantRequired()` |
| `api/v1/reports/cash` | GET | Reporte de caja | `@TenantRequired()` |
| `api/v1/reports/cash/summary` | GET | Resumen de caja por turno | `@TenantRequired()` |
| `api/v1/reports/export/:type` | GET | Exportar Excel (daily-sales, product-sales, category-sales, inventory) | `@TenantRequired()` |
| `api/v1/reports/mv/refresh` | POST | Refrescar materialized views | `@TenantRequired()` |

**Materialized Views** (actualizadas en `template.sql`):
- `_mv_sales_daily` — Ventas diarias pre-agrupadas
- `_mv_inventory_valuation` — Valorización de inventario
- `_mv_sales_by_category` — Ventas por categoría
- `_mv_cash_summary` — Resumen de caja

**Características**:
- **Hybrid approach**: MVs para datos históricos + query live para hoy
- `MvRefreshService`: refresca las 4 MVs (BullMQ-ready)
- **Excel templates** personalizados con `exceljs`:
  - Header azul `#3B82F6`, texto blanco bold
  - Columnas auto-ajustadas
  - Formato moneda para montos
  - Bordes en celdas

**Archivos**:
- `apps/api/src/modules/reports/domain/entities/report.entities.ts`
- `apps/api/src/modules/reports/application/ports/reports.repository.port.ts`
- `apps/api/src/modules/reports/application/use-cases/dashboard.use-case.ts`
- `apps/api/src/modules/reports/application/use-cases/daily-sales.use-case.ts`
- `apps/api/src/modules/reports/application/use-cases/product-sales.use-case.ts`
- `apps/api/src/modules/reports/application/use-cases/category-sales.use-case.ts`
- `apps/api/src/modules/reports/application/use-cases/inventory-valuation.use-case.ts`
- `apps/api/src/modules/reports/application/use-cases/cash-report.use-case.ts`
- `apps/api/src/modules/reports/application/services/mv-refresh.service.ts`
- `apps/api/src/modules/reports/infrastructure/repositories/prisma-reports.repository.ts`
- `apps/api/src/modules/reports/infrastructure/http/reports.controller.ts`
- `apps/api/src/modules/reports/infrastructure/templates/excel-templates.ts`
- `apps/api/src/modules/reports/reports.tokens.ts`
- `apps/api/src/modules/reports/reports.module.ts`

---

## Cambios en Schema (template.sql)

### Nuevas tablas en tenant schema:

```sql
-- Branches con UUID
CREATE TABLE IF NOT EXISTS "Branch" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(100) NOT NULL,
  "address" VARCHAR(255),
  "phone" VARCHAR(20),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Customers v2
CREATE TABLE IF NOT EXISTS "Customer" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(150) NOT NULL,
  "email" VARCHAR(150),
  "phone" VARCHAR(20),
  "type" VARCHAR(20) DEFAULT 'INDIVIDUAL',  -- INDIVIDUAL | BUSINESS
  "documentType" VARCHAR(20),                -- DNI | RUC | CE | PASSPORT
  "documentNumber" VARCHAR(20),
  "address" VARCHAR(255),
  "city" VARCHAR(100),
  "state" VARCHAR(100),
  "zipCode" VARCHAR(20),
  "creditBalance" DECIMAL(10,2) DEFAULT 0,
  "walletBalance" DECIMAL(10,2) DEFAULT 0,
  "notes" TEXT,
  "active" BOOLEAN DEFAULT true,
  "createdBy" UUID,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Tenant settings (JSONB)
CREATE TABLE IF NOT EXISTS "TenantSettings" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "key" VARCHAR(50) NOT NULL,
  "value" JSONB,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE("tenantId", "key")
);

-- Audit log (shared schema)
CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenantId" UUID NOT NULL,
  "userId" UUID,
  "action" VARCHAR(50) NOT NULL,  -- CREATE | UPDATE | DELETE
  "entity" VARCHAR(50) NOT NULL,
  "entityId" UUID,
  "oldValues" JSONB,
  "newValues" JSONB,
  "ipAddress" VARCHAR(45),
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);
```

### Migración branch_id (todas las tablas tenant):
```sql
-- Migrar branch_code a branch_id en todas las tablas
ALTER TABLE "Sale" DROP COLUMN IF EXISTS "branch_code";
ALTER TABLE "Sale" ADD COLUMN "branch_id" UUID REFERENCES "Branch"("id");

ALTER TABLE "Product" DROP COLUMN IF EXISTS "branch_code";
ALTER TABLE "Product" ADD COLUMN "branch_id" UUID REFERENCES "Branch"("id");

ALTER TABLE "Category" DROP COLUMN IF EXISTS "branch_code";
ALTER TABLE "Category" ADD COLUMN "branch_id" UUID REFERENCES "Branch"("id");

-- ... (migrar todas las tablas)
```

### Materialized Views actualizadas:

```sql
-- _mv_sales_daily
CREATE MATERIALIZED VIEW IF NOT EXISTS "_mv_sales_daily" AS
SELECT 
  DATE("saleDate") AS "date",
  "branchId",
  COUNT(*) AS "totalSales",
  SUM("total") AS "totalRevenue",
  SUM("tax") AS "totalTax",
  AVG("total") AS "averageTicket"
FROM "Sale"
WHERE "status" = 'COMPLETED'
GROUP BY DATE("saleDate"), "branchId";

-- _mv_inventory_valuation
CREATE MATERIALIZED VIEW IF NOT EXISTS "_mv_inventory_valuation" AS
SELECT 
  p."id" AS "productId",
  p."name" AS "productName",
  p."sku",
  p."branchId",
  COALESCE(s."quantity", 0) AS "quantity",
  p."costPrice",
  COALESCE(s."quantity", 0) * p."costPrice" AS "totalValue"
FROM "Product" p
LEFT JOIN "Stock" s ON p."id" = s."productId"
WHERE p."isActive" = true;

-- _mv_sales_by_category
CREATE MATERIALIZED VIEW IF NOT EXISTS "_mv_sales_by_category" AS
SELECT 
  DATE(s."saleDate") AS "date",
  c."id" AS "categoryId",
  c."name" AS "categoryName",
  s."branchId",
  SUM(si."total") AS "categoryTotal",
  SUM(si."quantity") AS "categoryQuantity"
FROM "Sale" s
JOIN "SaleItem" si ON s."id" = si."saleId"
JOIN "Product" p ON si."productId" = p."id"
JOIN "Category" c ON p."categoryId" = c."id"
WHERE s."status" = 'COMPLETED'
GROUP BY DATE(s."saleDate"), c."id", c."name", s."branchId";

-- _mv_cash_summary
CREATE MATERIALIZED VIEW IF NOT EXISTS "_mv_cash_summary" AS
SELECT 
  DATE(c."openDate") AS "date",
  c."branchId",
  c."cashierId",
  COUNT(*) AS "totalSessions",
  SUM(c."totalSales") AS "totalSales",
  SUM(c."totalExpenses") AS "totalExpenses",
  SUM(c."totalSales" - c."totalExpenses") AS "netTotal"
FROM "CashSession" c
WHERE c."status" = 'CLOSED'
GROUP BY DATE(c."openDate"), c."branchId", c."cashierId";
```

---

## Dependencias Nuevas

```json
{
  "dependencies": {
    "exceljs": "^4.4.0"
  },
  "devDependencies": {
    "@types/exceljs": "^1.0.0",
    "@types/express": "^4.17.21"
  }
}
```

---

## Decisiones de Diseño

| Decisión | Elección | Razón |
|----------|----------|-------|
| Branch UUID | `branch_id UUID` con FK | Consistencia multi-tenant, evita duplicados |
| RBAC | `@Roles()` + `RolesGuard` | Patrón NestJS estándar, reusable |
| Auditoría | `@Audit()` + `AuditInterceptor` | No invasivo, decorador simple |
| Reportes | MVs + live query | Rendimiento histórico + datos frescos |
| Excel | `exceljs` con templates | Formato personalizado, colores, auto-fit |
| Búsqueda POS | Endpoint dedicado `/search` | Performance con ranking de relevancia |
| Settings | JSONB per-tenant | Flexibilidad sin schema rígido |

---

## Testing

```bash
# TypeCheck
pnpm typecheck  # ✅ 0 errores

# Lint
pnpm lint       # ✅ 0 errores, 0 warnings

# Unit tests (pendiente)
pnpm test       # ⚠️ No hay tests unitarios aún
```

---

## Pendiente (No incluido en Sprint 5)

1. **Tests unitarios** para los nuevos módulos
2. **Auth 401 fix**: `@CurrentTenant()` retorna `undefined` sin header `X-Tenant-Slug`
3. **Sprint 6**: Módulo Codes (barcode/QR), Storage (Cloudinary), Notifications
4. **E2E tests** con Playwright

---

## Imágenes de Ejemplo

### Excel Export - Daily Sales
```
+------------+----------+-----------+----------+---------+
| Fecha      | Ventas   | Ingresos  | Impuesto | Ticket  |
+------------+----------+-----------+----------+---------+
| 2026-01-15 | 45       | S/ 12,500 | S/ 2,250 | S/ 277  |
+------------+----------+-----------+----------+---------+
```

### Dashboard KPIs
```json
{
  "todayRevenue": 4500,
  "todaySales": 18,
  "averageTicket": 250,
  "lowStockProducts": 5,
  "pendingPayments": 3
}
```

---

## Instrucciones de Deploy

1. **Aplicar template.sql** a tenants existentes (requiere migración manual)
2. **Ejecutar migración** para agregar `branch_id` y eliminar `branch_code`
3. **Refrescar MVs**: `POST /api/v1/reports/mv/refresh`
4. **Verificar** que los endpoints responden con `X-Tenant-Slug` header
