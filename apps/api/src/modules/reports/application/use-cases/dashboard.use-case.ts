import { Inject, Injectable } from '@nestjs/common';
import type { DashboardKPIs } from '../../domain/entities/report.entities.js';
import { REPORTS_REPO } from '../../reports.tokens.js';
import type { ReportFilter, ReportsRepositoryPort } from '../ports/reports.repository.port.js';

@Injectable()
export class DashboardUseCases {
  constructor(@Inject(REPORTS_REPO) private readonly reportsRepo: ReportsRepositoryPort) {}

  async getKPIs(): Promise<DashboardKPIs> {
    const [todaySales, todayTransactions, lowStockProducts] = await Promise.all([
      this.reportsRepo.getTodaySalesTotal(),
      this.reportsRepo.getTodayTransactionsCount(),
      this.reportsRepo.getLowStockCount(),
    ]);

    return {
      todaySales,
      todayTransactions,
      averageTicket:
        todayTransactions > 0 ? Math.round((todaySales / todayTransactions) * 100) / 100 : 0,
      lowStockProducts,
      activeBranches: 0,
      activeCustomers: 0,
    };
  }

  async getHourlyHeatmap(filter: ReportFilter) {
    return this.reportsRepo.getHourlyHeatmap(filter);
  }
}
