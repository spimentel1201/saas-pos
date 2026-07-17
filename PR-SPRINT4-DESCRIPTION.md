# PR: Sprint 4 — Módulos POS (Sales) y Caja (Cash)

## Resumen

Implementación completa de los módulos **Sales** (punto de venta) y **Cash** (gestión de caja) siguiendo la arquitectura DDD-lite del proyecto. Ambos módulos están multi-tenant (schema-per-tenant) y utilizan `TenantPrismaService.$queryRaw` para todas las operaciones contra tablas tenant.

**Commits:**
- `8a31f98` — feat(sales+cash): implementar módulos POS y caja (Sprint 4)
- `9c429dc` — fix(sales): mapear sortBy camelCase a snake_case para ORDER BY SQL

**Archivos:** 18 archivos modificados/creados (+1,989 líneas)

---

## Módulo Sales — Punto de Venta

### Entidades de dominio (`domain/entities/sale.entity.ts`)

| Entidad | Descripción |
|---------|-------------|
| `Sale` | Venta completa: id (ULID), branchCode, userId, numberSeq, items, payments, status, meta |
| `SaleItem` | Línea de venta: productId, qty, unitPrice, taxAmount, discount, total |
| `SalePayment` | Pago asociado: method (CASH/CARD/TRANSFER/CREDIT/MIXED), amount, ref |
| `SaleReturn` | Devolución: id, saleId, reason, items, total |

**Estados de venta:** `COMPLETED` → `VOID` | `RETURNED` | `PARTIAL_RETURN`

### Servicio de dominio (`domain/services/sale-calculator.service.ts`)

- `computeSaleTotals(items, globalDiscount)` — Calcula subtotal, tax, discount, total
- `computeNumberSeq(branchCode, dayIso, countToday)` — Genera número secuencial del día
- `sumCashAmount(sale)` — Suma pagos en efectivo

### Puerto del repositorio (`application/ports/sale.repository.port.ts`)

```typescript
interface SaleRepositoryPort {
  nextNumberSeq(branchCode, date): Promise<number>;
  checkout(input: CheckoutInput): Promise<Sale>;
  findById(id): Promise<Sale | null>;
  findAll(filter: SaleFilter): Promise<PaginatedSales>;
  registerReturn(input: ReturnInput): Promise<SaleReturn>;
  listReturns(saleId): Promise<SaleReturn[]>;
  voidSale(id): Promise<void>;
}
```

### Casos de uso (`application/use-cases/sales.use-case.ts`)

| Caso de uso | Descripción |
|-------------|-------------|
| `checkout` | Procesa venta multi-pago: valida carrito, verifica stock, calcula totales, inserta venta + items + pagos + deduce inventario + registra movimiento de caja (todo atómicamente) |
| `getById` | Obtiene venta por ID con items y pagos |
| `search` | Listado paginado con filtros (branchCode, userId, customerId, status, fechas) |
| `voidSale` | Anula una venta (cambia estado a VOID) |
| `createReturn` | Registra devolución parcial o total, devuelve stock, actualiza estado |
| `listReturns` | Lista devoluciones de una venta |

### Endpoints (`infrastructure/http/sales.controller.ts`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/sales/checkout` | Procesar checkout multi-pago |
| `GET` | `/sales/:id` | Obtener venta por ID |
| `GET` | `/sales` | Listar ventas con filtros |
| `PATCH` | `/sales/:id/void` | Anular venta |
| `POST` | `/sales/returns` | Registrar devolución |
| `GET` | `/sales/:id/returns` | Listar devoluciones de una venta |

### Repository (`infrastructure/repositories/prisma-sale.repository.ts`)

- **Checkout transaccional**: Inserta venta, items, descuenta stock (ON CONFLICT UPSERT), registra movimientos de inventario, inserta pagos y movimientos de caja — todo en una sola transacción `$queryRawUnsafe`.
- **Mapeo snake_case ↔ camelCase**: `branch_code → branchCode`, `created_at → createdAt`, etc.
- **Paginación**: COUNT + OFFSET/LIMIT con mapeo de `sortBy` camelCase a columnas SQL snake_case.

---

## Módulo Cash — Gestión de Caja

### Entidades de dominio (`domain/entities/cash.entity.ts`)

| Entidad | Descripción |
|---------|-------------|
| `CashSession` | Sesión de caja: id, branchCode, userId, openingBalance, expectedBalance, countedBalance, difference, status, notes |
| `CashMovement` | Movimiento de efectivo: sessionId, type, amount, reason, createdAt |

**Estados de sesión:** `OPEN` → `CLOSED` | `RECONCILING`

**Tipos de movimiento:** `IN` | `OUT` | `SALE` | `REFUND`

### Puerto del repositorio (`application/ports/cash.repository.port.ts`)

```typescript
interface CashSessionRepositoryPort {
  save(session): Promise<CashSession>;
  findById(id): Promise<CashSession | null>;
  findOpenByBranch(branchCode): Promise<CashSession | null>;
  findAll(branchCode?, status?): Promise<CashSession[]>;
  addMovement(sessionId, type, amount, reason?): Promise<CashMovement>;
  listMovements(sessionId): Promise<CashMovement[]>;
}
```

### Casos de uso (`application/use-cases/cash.use-case.ts`)

| Caso de uso | Descripción |
|-------------|-------------|
| `openSession` | Abre sesión de caja con saldo inicial (valida que no haya otra abierta) |
| `getOpenSession` | Obtiene sesión abierta por sucursal |
| `getSessionById` | Obtiene sesión por ID |
| `listSessions` | Listado con filtros (branchCode, status) |
| `closeSession` | Cierra sesión: calcula balance esperado (opening + sales + ins + refunds - outs), registra arqueo |
| `addMovement` | Agrega movimiento IN/OUT/REFUND a sesión abierta |
| `getMovements` | Lista movimientos de una sesión |

### Endpoints (`infrastructure/http/cash.controller.ts`)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/cash/open` | Abrir sesión de caja |
| `GET` | `/cash/open/:branchCode` | Obtener sesión abierta por sucursal |
| `PATCH` | `/cash/:sessionId/close` | Cerrar sesión con arqueo |
| `POST` | `/cash/:sessionId/movements` | Registrar entrada/salida/reembolso |
| `GET` | `/cash` | Listar sesiones de caja |
| `GET` | `/cash/:sessionId` | Obtener sesión por ID |
| `GET` | `/cash/:sessionId/movements` | Listar movimientos de una sesión |

---

## Arquitectura

```
modules/
├── sales/
│   ├── domain/
│   │   ├── entities/sale.entity.ts          # Sale, SaleItem, SalePayment, SaleReturn
│   │   └── services/sale-calculator.service.ts
│   ├── application/
│   │   ├── ports/sale.repository.port.ts    # Puerto + interfaces
│   │   ├── dtos/sales.dto.ts                # DTOs de entrada (class-validator)
│   │   └── use-cases/sales.use-case.ts      # Lógica de negocio
│   └── infrastructure/
│       ├── http/sales.controller.ts          # Endpoints NestJS
│       └── repositories/prisma-sale.repository.ts  # Implementación Prisma $queryRaw
│
├── cash/
│   ├── domain/
│   │   └── entities/cash.entity.ts          # CashSession, CashMovement
│   ├── application/
│   │   ├── ports/cash.repository.port.ts
│   │   ├── dtos/cash.dto.ts
│   │   └── use-cases/cash.use-case.ts
│   └── infrastructure/
│       ├── http/cash.controller.ts
│       └── repositories/prisma-cash.repository.ts
```

**Patrón DDD-lite**: `domain/` (entidades + lógica pura) ← `application/` (casos de uso + puertos) ← `infrastructure/` (controllers + repos Prisma)

**Multi-tenant**: Todos los endpoints llevan `@TenantRequired()`. Los repos usan `TenantPrismaService.withTenant()` que resuelve `search_path` automáticamente.

---

## Correcciones incluidas

- Mapeo `sortBy: 'createdAt'` → `created_at` para `ORDER BY` SQL (error `42703: column "createdat" does not exist`)
- Imports `type` para interfaces usadas en decoradores (`isolatedModules`)
- Imports `ApiBody` y `Max` faltantes
- Rutas de imports corregidas (`../ports/` → `../../application/ports/`)
- Tipado de `$queryRawUnsafe` (sin type args en `tx: any`, usando `as Type[]`)
- Null checks en `stockRows[0]` y `inserted[0]`
- Orden de argumentos en `cashUseCases.addMovement`

---

## Notas pendientes

- **Auth 401**: Los endpoints requieren header `X-Tenant-Slug` para resolver el tenant. Sin él, `@CurrentTenant()` retorna `undefined`.
- **Arqueo automático**: El cálculo de `expectedBalance` se hace en memoria al cerrar; no hay conciliación automática con BD.
- **Cash movements por ventas**: Solo se registran para pagos `CASH`; pagos con tarjeta/transferencia no generan movimiento de caja.
