import { Inject, Injectable, Logger } from '@nestjs/common';
import { REPORTS_REPO } from '../../reports.tokens.js';
import type { ReportsRepositoryPort } from '../ports/reports.repository.port.js';

const MV_REFRESH_VIEWS = [
  '_mv_sales_daily',
  '_mv_inventory_valuation',
  '_mv_sales_by_category',
  '_mv_cash_summary',
];

@Injectable()
export class MvRefreshService {
  private readonly logger = new Logger(MvRefreshService.name);

  constructor(@Inject(REPORTS_REPO) private readonly reportsRepo: ReportsRepositoryPort) {}

  async refreshAll(): Promise<void> {
    for (const view of MV_REFRESH_VIEWS) {
      try {
        await this.reportsRepo.refreshMaterializedView(view);
        this.logger.log(`Refreshed ${view}`);
      } catch (error) {
        this.logger.error(`Failed to refresh ${view}: ${error}`);
      }
    }
  }

  async refreshOne(viewName: string): Promise<void> {
    if (!MV_REFRESH_VIEWS.includes(viewName)) {
      throw new Error(`Unknown view: ${viewName}`);
    }
    await this.reportsRepo.refreshMaterializedView(viewName);
  }
}
