import type {
  CashSummaryReport,
  CategorySalesReport,
  DailySalesReport,
  HourlyHeatmap,
  InventoryValuationReport,
  TopProduct,
} from '../../domain/entities/report.entities.js';

export interface ReportFilter {
  branchId?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export interface ReportsRepositoryPort {
  getDailySales(filter: ReportFilter): Promise<DailySalesReport[]>;
  getCategorySales(filter: ReportFilter): Promise<CategorySalesReport[]>;
  getInventoryValuation(branchId?: string): Promise<InventoryValuationReport[]>;
  getCashSummary(filter: ReportFilter): Promise<CashSummaryReport[]>;
  getTopProducts(filter: ReportFilter, limit?: number): Promise<TopProduct[]>;
  getHourlyHeatmap(filter: ReportFilter): Promise<HourlyHeatmap[]>;
  getLowStockCount(): Promise<number>;
  getTodaySalesTotal(): Promise<number>;
  getTodayTransactionsCount(): Promise<number>;
  refreshMaterializedView(viewName: string): Promise<void>;
}
