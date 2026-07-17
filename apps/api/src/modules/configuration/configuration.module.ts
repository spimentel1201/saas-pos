import { Module } from '@nestjs/common';
import { TenantContextModule } from '../../shared/infrastructure/multi-tenant/tenant-context.module.js';
import {
  BranchUseCases,
  SettingsUseCases,
  TaxUseCases,
} from './application/use-cases/config.use-case.js';
import { BRANCH_REPO, SETTINGS_REPO, TAX_REPO } from './config.tokens.js';
import { ConfigController } from './infrastructure/http/config.controller.js';
import { PrismaBranchRepository } from './infrastructure/repositories/prisma-branch.repository.js';
import { PrismaSettingsRepository } from './infrastructure/repositories/prisma-settings.repository.js';
import { PrismaTaxRepository } from './infrastructure/repositories/prisma-tax.repository.js';

@Module({
  imports: [TenantContextModule],
  controllers: [ConfigController],
  providers: [
    BranchUseCases,
    TaxUseCases,
    SettingsUseCases,
    { provide: BRANCH_REPO, useClass: PrismaBranchRepository },
    { provide: TAX_REPO, useClass: PrismaTaxRepository },
    { provide: SETTINGS_REPO, useClass: PrismaSettingsRepository },
  ],
  exports: [BranchUseCases, TaxUseCases, SettingsUseCases],
})
export class ConfigurationModule {}
