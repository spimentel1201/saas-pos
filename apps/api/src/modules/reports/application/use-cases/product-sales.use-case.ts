import { Inject, Injectable } from '@nestjs/common';
import { REPORTS_REPO } from '../../reports.tokens.js';
import type { ReportFilter, ReportsRepositoryPort } from '../ports/reports.repository.port.js';

@Injectable()
export class ProductSalesUseCases {
  constructor(@Inject(REPORTS_REPO) private readonly reportsRepo: ReportsRepositoryPort) {}

  async execute(filter: ReportFilter) {
    return this.reportsRepo.getTopProducts(filter, filter.limit ?? 20);
  }
}
