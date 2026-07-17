import { Module } from '@nestjs/common';
import { CashController } from './infrastructure/http/cash.controller.js';
import { CashUseCases } from './application/use-cases/cash.use-case.js';
import { PrismaCashSessionRepository } from './infrastructure/repositories/prisma-cash.repository.js';
import { CASH_SESSION_REPO, TENANT_SCHEMA } from './cash.tokens.js';
import { TenantContextModule } from '../../shared/infrastructure/multi-tenant/tenant-context.module.js';

@Module({
  imports: [TenantContextModule],
  controllers: [CashController],
  providers: [
    CashUseCases,
    { provide: CASH_SESSION_REPO, useClass: PrismaCashSessionRepository },
    { provide: TENANT_SCHEMA, useFactory: () => '', inject: [] },
  ],
  exports: [CashUseCases],
})
export class CashModule {}