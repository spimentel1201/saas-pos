import { Module } from '@nestjs/common';
import { TenantContextModule } from '../../shared/infrastructure/multi-tenant/tenant-context.module.js';
import { MvRefreshService } from './application/services/mv-refresh.service.js';
import { CashReportUseCases } from './application/use-cases/cash-report.use-case.js';
import { CategorySalesUseCases } from './application/use-cases/category-sales.use-case.js';
import { DailySalesUseCases } from './application/use-cases/daily-sales.use-case.js';
import { DashboardUseCases } from './application/use-cases/dashboard.use-case.js';
import { InventoryValuationUseCases } from './application/use-cases/inventory-valuation.use-case.js';
import { ProductSalesUseCases } from './application/use-cases/product-sales.use-case.js';
import { ReportsController } from './infrastructure/http/reports.controller.js';
import { PrismaReportsRepository } from './infrastructure/repositories/prisma-reports.repository.js';
import { REPORTS_REPO } from './reports.tokens.js';

@Module({
  imports: [TenantContextModule],
  controllers: [ReportsController],
  providers: [
    DashboardUseCases,
    DailySalesUseCases,
    ProductSalesUseCases,
    CategorySalesUseCases,
    InventoryValuationUseCases,
    CashReportUseCases,
    MvRefreshService,
    { provide: REPORTS_REPO, useClass: PrismaReportsRepository },
  ],
  exports: [
    DashboardUseCases,
    DailySalesUseCases,
    ProductSalesUseCases,
    CategorySalesUseCases,
    InventoryValuationUseCases,
    CashReportUseCases,
    MvRefreshService,
  ],
})
export class ReportsModule {}
