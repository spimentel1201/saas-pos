import { Inject, Injectable } from '@nestjs/common';
import { REPORTS_REPO } from '../../reports.tokens.js';
import type { ReportsRepositoryPort } from '../ports/reports.repository.port.js';

@Injectable()
export class InventoryValuationUseCases {
  constructor(@Inject(REPORTS_REPO) private readonly reportsRepo: ReportsRepositoryPort) {}

  async execute(branchId?: string) {
    return this.reportsRepo.getInventoryValuation(branchId);
  }
}
