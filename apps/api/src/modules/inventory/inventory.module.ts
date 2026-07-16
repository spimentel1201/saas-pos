import { Module } from '@nestjs/common';
import { TenantContextModule } from '../../shared/infrastructure/multi-tenant/tenant-context.module.js';
import { InventoryUseCases } from './application/use-cases/inventory.use-case.js';
import { InventoryController } from './infrastructure/http/inventory.controller.js';
import {
  PrismaStockRepository,
  PrismaTransferRepository,
} from './infrastructure/repositories/prisma-inventory.repository.js';
import { STOCK_REPO, TENANT_SCHEMA, TRANSFER_REPO } from './inventory.tokens.js';

@Module({
  imports: [TenantContextModule],
  controllers: [InventoryController],
  providers: [
    InventoryUseCases,
    { provide: STOCK_REPO, useClass: PrismaStockRepository },
    { provide: TRANSFER_REPO, useClass: PrismaTransferRepository },
    { provide: TENANT_SCHEMA, useFactory: () => '', inject: [] },
  ],
  exports: [InventoryUseCases],
})
export class InventoryModule {}
