import { BullModule } from '@nestjs/bullmq';
/**
 * Modulo raiz de la API.
 *
 * Compone los 13 modulos de dominio del MVP + los cross-cutting concerns
 * (config, multi-tenant, rate-limit, emitter, queues, swagger).
 *
 * El orden importa solo para el orden de instanciacion de los guards globales,
 * que se configuran mediante APP_* providers.
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

// Cross-cutting
import { JwtAuthGuard } from './modules/auth/infrastructure/http/jwt-auth.guard.js';
import { AllExceptionsFilter } from './shared/infrastructure/http/all-exceptions.filter.js';
import { LoggerModule } from './shared/infrastructure/logger/logger.module.js';
import { TenantContextModule } from './shared/infrastructure/multi-tenant/tenant-context.module.js';
import { TenantGuard } from './shared/infrastructure/multi-tenant/tenant.guard.js';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module.js';

// Modulos de dominio (orden alfabetico)
import { AuthModule } from './modules/auth/auth.module.js';
import { BillingModule } from './modules/billing/billing.module.js';
import { CashModule } from './modules/cash/cash.module.js';
import { CatalogModule } from './modules/catalog/catalog.module.js';
import { ConfigurationModule } from './modules/configuration/configuration.module.js';
import { CustomersModule } from './modules/customers/customers.module.js';
import { InventoryModule } from './modules/inventory/inventory.module.js';
import { PurchasingModule } from './modules/purchasing/purchasing.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { SalesModule } from './modules/sales/sales.module.js';
import { TenantsModule } from './modules/tenants/tenants.module.js';
import { UsersModule } from './modules/users/users.module.js';
// import { CodesModule } from './modules/codes/codes.module.js';
// import { StorageModule } from './modules/storage/storage.module.js';
// import { NotificationsModule } from './modules/notifications/notifications.module.js';

@Module({
  imports: [
    // ---- Cross-cutting ----
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 5 },
      { name: 'medium', ttl: 10_000, limit: 50 },
      { name: 'tenant', ttl: 60_000, limit: 500 },
    ]),
    BullModule.forRoot({ connection: { host: 'localhost', port: 6379 } }),
    PrismaModule,
    LoggerModule,
    TenantContextModule,

    // ---- Dominio ----
    AuthModule,
    TenantsModule,
    BillingModule,
    CatalogModule,
    ConfigurationModule,
    CustomersModule,
    InventoryModule,
    PurchasingModule,
    ReportsModule,
    SalesModule,
    CashModule,
    UsersModule,
    // CodesModule, StorageModule, NotificationsModule,
  ],
  providers: [
    Reflector,
    // Orden de guards: primero throttle, luego tenant context, luego auth
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Filtro global de excepciones
    AllExceptionsFilter,
  ],
})
export class AppModule {}
