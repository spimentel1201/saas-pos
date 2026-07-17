import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../../../../shared/infrastructure/prisma/tenant-prisma.service.js';
import type {
  ReportFilter,
  ReportsRepositoryPort,
} from '../../application/ports/reports.repository.port.js';
import type {
  CashSummaryReport,
  CategorySalesReport,
  DailySalesReport,
  HourlyHeatmap,
  InventoryValuationReport,
  TopProduct,
} from '../../domain/entities/report.entities.js';

@Injectable()
export class PrismaReportsRepository implements ReportsRepositoryPort {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async getDailySales(filter: ReportFilter): Promise<DailySalesReport[]> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const conditions: string[] = ["s.status = 'COMPLETED'"];
      // biome-ignore lint/suspicious/noExplicitAny: dynamic params
      const params: any[] = [];
      let idx = 1;

      if (filter.branchId) {
        conditions.push(`s.branch_id = $${idx++}`);
        params.push(filter.branchId);
      }
      if (filter.from) {
        conditions.push(`s.created_at >= $${idx++}`);
        params.push(filter.from);
      }
      if (filter.to) {
        conditions.push(`s.created_at <= $${idx++}`);
        params.push(filter.to);
      }

      const _where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const isToday = !filter.from && !filter.to;
      if (isToday) {
        conditions.push('s.created_at >= CURRENT_DATE');
      }

      const finalWhere = `WHERE ${conditions.join(' AND ')}`;

      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT s.branch_id, b.name as branch_name,
                date_trunc('day', s.created_at) as day,
                si.product_id, p.name as product_name,
                p.category_id, coalesce(cat.name, 'Sin categoria') as category_name,
                s.user_id,
                count(*) as sales_count,
                sum(si.qty) as qty_sold,
                sum(si.total) as gross_total,
                sum(si.total - si.qty * p.cost) as gross_profit
         FROM sales s
         JOIN branches b ON b.id = s.branch_id
         JOIN sale_items si ON si.sale_id = s.id
         JOIN products p ON p.id = si.product_id
         LEFT JOIN categories cat ON cat.id = p.category_id
         ${finalWhere}
         GROUP BY s.branch_id, b.name, date_trunc('day', s.created_at),
                  si.product_id, p.name, p.category_id, cat.name, s.user_id
         ORDER BY day DESC, gross_total DESC`,
        ...params,
      );

      return rows.map((r) => ({
        branchId: r.branch_id,
        branchName: r.branch_name,
        day: new Date(r.day),
        productId: r.product_id,
        productName: r.product_name,
        categoryId: r.category_id ?? '',
        categoryName: r.category_name,
        userId: r.user_id,
        salesCount: Number(r.sales_count),
        qtySold: Number(r.qty_sold),
        grossTotal: Number(r.gross_total),
        grossProfit: Number(r.gross_profit),
      }));
    });
  }

  async getCategorySales(filter: ReportFilter): Promise<CategorySalesReport[]> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const conditions: string[] = ["s.status = 'COMPLETED'"];
      // biome-ignore lint/suspicious/noExplicitAny: dynamic params
      const params: any[] = [];
      let idx = 1;

      if (filter.branchId) {
        conditions.push(`s.branch_id = $${idx++}`);
        params.push(filter.branchId);
      }
      if (filter.from) {
        conditions.push(`s.created_at >= $${idx++}`);
        params.push(filter.from);
      }
      if (filter.to) {
        conditions.push(`s.created_at <= $${idx++}`);
        params.push(filter.to);
      }

      const where = `WHERE ${conditions.join(' AND ')}`;

      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT s.branch_id, b.name as branch_name,
                date_trunc('day', s.created_at) as day,
                p.category_id, coalesce(cat.name, 'Sin categoria') as category_name,
                sum(si.total) as gross_total,
                sum(si.total - si.qty * p.cost) as gross_profit,
                sum(si.qty) as qty_sold
         FROM sales s
         JOIN branches b ON b.id = s.branch_id
         JOIN sale_items si ON si.sale_id = s.id
         JOIN products p ON p.id = si.product_id
         LEFT JOIN categories cat ON cat.id = p.category_id
         ${where}
         GROUP BY s.branch_id, b.name, date_trunc('day', s.created_at), p.category_id, cat.name
         ORDER BY day DESC, gross_total DESC`,
        ...params,
      );

      return rows.map((r) => ({
        branchId: r.branch_id,
        branchName: r.branch_name,
        day: new Date(r.day),
        categoryId: r.category_id ?? '',
        categoryName: r.category_name,
        grossTotal: Number(r.gross_total),
        grossProfit: Number(r.gross_profit),
        qtySold: Number(r.qty_sold),
      }));
    });
  }

  async getInventoryValuation(branchId?: string): Promise<InventoryValuationReport[]> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const where = branchId ? 'WHERE ist.branch_id = $1' : '';
      const params = branchId ? [branchId] : [];

      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT ist.branch_id, b.name as branch_name,
                ist.product_id, p.name as product_name,
                ist.qty, ist.avg_cost,
                ist.qty * ist.avg_cost as valuation
         FROM inventory_stocks ist
         JOIN branches b ON b.id = ist.branch_id
         JOIN products p ON p.id = ist.product_id
         ${where}
         ORDER BY valuation DESC`,
        ...params,
      );

      return rows.map((r) => ({
        branchId: r.branch_id,
        branchName: r.branch_name,
        productId: r.product_id,
        productName: r.product_name,
        qty: Number(r.qty),
        avgCost: Number(r.avg_cost),
        valuation: Number(r.valuation),
      }));
    });
  }

  async getCashSummary(filter: ReportFilter): Promise<CashSummaryReport[]> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const conditions: string[] = ["cs.status = 'CLOSED'"];
      // biome-ignore lint/suspicious/noExplicitAny: dynamic params
      const params: any[] = [];
      let idx = 1;

      if (filter.branchId) {
        conditions.push(`cs.branch_id = $${idx++}`);
        params.push(filter.branchId);
      }
      if (filter.from) {
        conditions.push(`cs.opened_at >= $${idx++}`);
        params.push(filter.from);
      }
      if (filter.to) {
        conditions.push(`cs.opened_at <= $${idx++}`);
        params.push(filter.to);
      }

      const where = `WHERE ${conditions.join(' AND ')}`;

      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT cs.branch_id, b.name as branch_name,
                date_trunc('day', cs.opened_at) as day,
                count(*) as session_count,
                sum(cs.opening_balance) as total_opening,
                coalesce(sum(cs.expected_balance), 0) as total_expected,
                coalesce(sum(cs.counted_balance), 0) as total_collected,
                coalesce(sum(cs.difference), 0) as total_difference
         FROM cash_sessions cs
         JOIN branches b ON b.id = cs.branch_id
         ${where}
         GROUP BY cs.branch_id, b.name, date_trunc('day', cs.opened_at)
         ORDER BY day DESC`,
        ...params,
      );

      return rows.map((r) => ({
        branchId: r.branch_id,
        branchName: r.branch_name,
        day: new Date(r.day),
        sessionCount: Number(r.session_count),
        totalOpening: Number(r.total_opening),
        totalExpected: Number(r.total_expected),
        totalCollected: Number(r.total_collected),
        totalDifference: Number(r.total_difference),
      }));
    });
  }

  async getTopProducts(filter: ReportFilter, limit = 20): Promise<TopProduct[]> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const conditions: string[] = ["s.status = 'COMPLETED'"];
      // biome-ignore lint/suspicious/noExplicitAny: dynamic params
      const params: any[] = [];
      let idx = 1;

      if (filter.branchId) {
        conditions.push(`s.branch_id = $${idx++}`);
        params.push(filter.branchId);
      }
      if (filter.from) {
        conditions.push(`s.created_at >= $${idx++}`);
        params.push(filter.from);
      }
      if (filter.to) {
        conditions.push(`s.created_at <= $${idx++}`);
        params.push(filter.to);
      }
      params.push(limit);

      const where = `WHERE ${conditions.join(' AND ')}`;

      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT si.product_id, p.name as product_name,
                sum(si.qty) as total_sold,
                sum(si.total) as total_revenue
         FROM sales s
         JOIN sale_items si ON si.sale_id = s.id
         JOIN products p ON p.id = si.product_id
         ${where}
         GROUP BY si.product_id, p.name
         ORDER BY total_revenue DESC
         LIMIT $${idx}`,
        ...params,
      );

      return rows.map((r) => ({
        productId: r.product_id,
        productName: r.product_name,
        totalSold: Number(r.total_sold),
        totalRevenue: Number(r.total_revenue),
      }));
    });
  }

  async getHourlyHeatmap(filter: ReportFilter): Promise<HourlyHeatmap[]> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const conditions: string[] = ["s.status = 'COMPLETED'"];
      // biome-ignore lint/suspicious/noExplicitAny: dynamic params
      const params: any[] = [];
      let idx = 1;

      if (filter.branchId) {
        conditions.push(`s.branch_id = $${idx++}`);
        params.push(filter.branchId);
      }
      if (filter.from) {
        conditions.push(`s.created_at >= $${idx++}`);
        params.push(filter.from);
      }
      if (filter.to) {
        conditions.push(`s.created_at <= $${idx++}`);
        params.push(filter.to);
      }

      const where = `WHERE ${conditions.join(' AND ')}`;

      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT extract(hour from s.created_at) as hour,
                count(*) as sales_count,
                sum(s.total) as total_amount
         FROM sales s
         ${where}
         GROUP BY extract(hour from s.created_at)
         ORDER BY hour`,
        ...params,
      );

      return rows.map((r) => ({
        hour: Number(r.hour),
        salesCount: Number(r.sales_count),
        totalAmount: Number(r.total_amount),
      }));
    });
  }

  async getLowStockCount(): Promise<number> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const rows = await tx.$queryRawUnsafe<{ count: number }[]>(
        `SELECT count(*) as count
         FROM inventory_stocks ist
         JOIN products p ON p.id = ist.product_id
         WHERE p.track_stock = true AND p.is_active = true AND ist.qty <= ist.min_qty AND ist.min_qty > 0`,
      );
      return Number(rows[0]?.count ?? 0);
    });
  }

  async getTodaySalesTotal(): Promise<number> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const rows = await tx.$queryRawUnsafe<{ total: number }[]>(
        `SELECT coalesce(sum(total), 0) as total
         FROM sales
         WHERE status = 'COMPLETED' AND created_at >= CURRENT_DATE`,
      );
      return Number(rows[0]?.total ?? 0);
    });
  }

  async getTodayTransactionsCount(): Promise<number> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const rows = await tx.$queryRawUnsafe<{ count: number }[]>(
        `SELECT count(*) as count
         FROM sales
         WHERE status = 'COMPLETED' AND created_at >= CURRENT_DATE`,
      );
      return Number(rows[0]?.count ?? 0);
    });
  }

  async refreshMaterializedView(viewName: string): Promise<void> {
    await this.tenantPrisma.withTenant(async (tx) => {
      await tx.$executeRawUnsafe(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${viewName}`);
    });
  }
}
