import { Module } from '@nestjs/common';
import { SalesController } from './infrastructure/http/sales.controller.js';
import { SalesUseCases } from './application/use-cases/sales.use-case.js';
import { PrismaSaleRepository } from './infrastructure/repositories/prisma-sale.repository.js';
import { SALE_REPO, TENANT_SCHEMA } from './sales.tokens.js';
import { TenantContextModule } from '../../shared/infrastructure/multi-tenant/tenant-context.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';

@Module({
  imports: [TenantContextModule, InventoryModule],
  controllers: [SalesController],
  providers: [
    SalesUseCases,
    { provide: SALE_REPO, useClass: PrismaSaleRepository },
    { provide: TENANT_SCHEMA, useFactory: () => '', inject: [] },
  ],
  exports: [SalesUseCases],
})
export class SalesModule {}