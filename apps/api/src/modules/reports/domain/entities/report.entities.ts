export interface DailySalesReport {
  branchId: string;
  branchName: string;
  day: Date;
  productId: string;
  productName: string;
  categoryId: string;
  categoryName: string;
  userId: string;
  salesCount: number;
  qtySold: number;
  grossTotal: number;
  grossProfit: number;
}

export interface CategorySalesReport {
  branchId: string;
  branchName: string;
  day: Date;
  categoryId: string;
  categoryName: string;
  grossTotal: number;
  grossProfit: number;
  qtySold: number;
}

export interface InventoryValuationReport {
  branchId: string;
  branchName: string;
  productId: string;
  productName: string;
  qty: number;
  avgCost: number;
  valuation: number;
}

export interface CashSummaryReport {
  branchId: string;
  branchName: string;
  day: Date;
  sessionCount: number;
  totalOpening: number;
  totalExpected: number;
  totalCollected: number;
  totalDifference: number;
}

export interface DashboardKPIs {
  todaySales: number;
  todayTransactions: number;
  averageTicket: number;
  lowStockProducts: number;
  activeBranches: number;
  activeCustomers: number;
}

export interface HourlyHeatmap {
  hour: number;
  salesCount: number;
  totalAmount: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;
}
