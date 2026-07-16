import { Module } from '@nestjs/common';
import { TenantContextModule } from '../../shared/infrastructure/multi-tenant/tenant-context.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { PurchasingUseCases } from './application/use-cases/purchasing.use-case.js';
import { PurchasingController } from './infrastructure/http/purchasing.controller.js';
import {
  PrismaPurchaseOrderRepository,
  PrismaSupplierRepository,
} from './infrastructure/repositories/prisma-purchasing.repository.js';
import { PURCHASE_ORDER_REPO, SUPPLIER_REPO, TENANT_SCHEMA } from './purchasing.tokens.js';

@Module({
  imports: [TenantContextModule, InventoryModule],
  controllers: [PurchasingController],
  providers: [
    PurchasingUseCases,
    { provide: SUPPLIER_REPO, useClass: PrismaSupplierRepository },
    { provide: PURCHASE_ORDER_REPO, useClass: PrismaPurchaseOrderRepository },
    { provide: TENANT_SCHEMA, useFactory: () => '', inject: [] },
  ],
  exports: [PurchasingUseCases],
})
export class PurchasingModule {}
