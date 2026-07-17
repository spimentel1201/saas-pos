import { Module } from '@nestjs/common';
import { TenantContextModule } from '../../shared/infrastructure/multi-tenant/tenant-context.module.js';
import { CustomerUseCases } from './application/use-cases/customer.use-case.js';
import { CUSTOMER_REPO } from './customers.tokens.js';
import { CustomerController } from './infrastructure/http/customer.controller.js';
import { PrismaCustomerRepository } from './infrastructure/repositories/prisma-customer.repository.js';

@Module({
  imports: [TenantContextModule],
  controllers: [CustomerController],
  providers: [CustomerUseCases, { provide: CUSTOMER_REPO, useClass: PrismaCustomerRepository }],
  exports: [CustomerUseCases],
})
export class CustomersModule {}
