import { Module } from '@nestjs/common';
import { TenantContextModule } from '../../shared/infrastructure/multi-tenant/tenant-context.module.js';
import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { OnboardingUseCases } from './application/use-cases/onboarding.use-case.js';
import { TenantsController } from './infrastructure/http/tenants.controller.js';
import { PrismaTenantRepository } from './infrastructure/repositories/prisma-tenant.repository.js';
import { TENANT_REPO } from './tenants.tokens.js';

@Module({
  imports: [AuthModule, TenantContextModule, PrismaModule],
  controllers: [TenantsController],
  providers: [OnboardingUseCases, { provide: TENANT_REPO, useClass: PrismaTenantRepository }],
  exports: [OnboardingUseCases],
})
export class TenantsModule {}
