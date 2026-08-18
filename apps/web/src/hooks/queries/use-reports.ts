'use client';

import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';

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

export interface DailySalesReport {
  branchId: string;
  branchName: string;
  day: string;
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
  day: string;
  categoryId: string;
  categoryName: string;
  grossTotal: number;
  grossProfit: number;
  qtySold: number;
}

export interface TopProduct {
  productId: string;
  productName: string;
  totalSold: number;
  totalRevenue: number;
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
  day: string;
  sessionCount: number;
  totalOpening: number;
  totalExpected: number;
  totalCollected: number;
  totalDifference: number;
}

export interface PaymentMethodReport {
  method: string;
  methodName: string;
  transactions: number;
  totalAmount: number;
}

export interface ReportFilter {
  branchId?: string;
  from?: string;
  to?: string;
  limit?: number;
}

// ---- Dashboard (30s stale, no retry) ----

const DASHBOARD_OPTS = {
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  staleTime: 30_000,
  retry: false,
} as const;

export function useDashboardKPIs() {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<DashboardKPIs, Error>({
    queryKey: ['reports', 'dashboard'],
    queryFn: () => api.get('/reports/dashboard'),
    enabled: isAuthenticated,
    ...DASHBOARD_OPTS,
  });
}

export function useHeatmap(filter: Omit<ReportFilter, 'limit'> = {}) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<HourlyHeatmap[], Error>({
    queryKey: ['reports', 'heatmap', filter],
    queryFn: () =>
      api.get('/reports/dashboard/heatmap', {
        params: filter as Record<string, string | undefined>,
      }),
    enabled: isAuthenticated,
    ...DASHBOARD_OPTS,
  });
}

// ---- Sales Reports ----

export function useDailySales(filter: ReportFilter = {}) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<DailySalesReport[], Error>({
    queryKey: ['reports', 'sales', 'daily', filter],
    queryFn: () =>
      api.get('/reports/sales/daily', { params: filter as Record<string, string | undefined> }),
    enabled: isAuthenticated,
    ...DASHBOARD_OPTS,
  });
}

export function useSalesByProduct(filter: ReportFilter = {}) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<TopProduct[], Error>({
    queryKey: ['reports', 'sales', 'by-product', filter],
    queryFn: () =>
      api.get('/reports/sales/by-product', {
        params: filter as Record<string, string | undefined>,
      }),
    enabled: isAuthenticated,
    ...DASHBOARD_OPTS,
  });
}

export function useSalesByCategory(filter: ReportFilter = {}) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<CategorySalesReport[], Error>({
    queryKey: ['reports', 'sales', 'by-category', filter],
    queryFn: () =>
      api.get('/reports/sales/by-category', {
        params: filter as Record<string, string | undefined>,
      }),
    enabled: isAuthenticated,
    ...DASHBOARD_OPTS,
  });
}

export function useSalesByPayment(filter: ReportFilter = {}) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<PaymentMethodReport[], Error>({
    queryKey: ['reports', 'sales', 'by-payment', filter],
    queryFn: () =>
      api.get('/reports/sales/by-payment', {
        params: filter as Record<string, string | undefined>,
      }),
    enabled: isAuthenticated,
    ...DASHBOARD_OPTS,
  });
}

// ---- Other Reports ----

export function useInventoryValuation(branchId?: string) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<InventoryValuationReport[], Error>({
    queryKey: ['reports', 'inventory', branchId],
    queryFn: () => api.get('/reports/inventory/valuation', { params: { branchId } }),
    enabled: isAuthenticated,
    ...DASHBOARD_OPTS,
  });
}

export function useCashReport(filter: ReportFilter = {}) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<CashSummaryReport[], Error>({
    queryKey: ['reports', 'cash', filter],
    queryFn: () =>
      api.get('/reports/cash', { params: filter as Record<string, string | undefined> }),
    enabled: isAuthenticated,
    ...DASHBOARD_OPTS,
  });
}

// ---- Export ----

export function getReportExportUrl(type: string, filter: ReportFilter = {}): string {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';
  const params = new URLSearchParams();
  if (filter.branchId) params.set('branchId', filter.branchId);
  if (filter.from) params.set('from', filter.from);
  if (filter.to) params.set('to', filter.to);
  const qs = params.toString();
  return `${API_BASE}/reports/export/${type}${qs ? `?${qs}` : ''}`;
}

const REPORT_FILENAMES: Record<string, string> = {
  'daily-sales': 'ventas-diarias.xlsx',
  'by-category': 'ventas-por-categoria.xlsx',
  inventory: 'inventario-valorizado.xlsx',
  cash: 'reporte-caja.xlsx',
};

export async function downloadReport(type: string, filter: ReportFilter = {}): Promise<void> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';
  const { accessToken, refreshToken, tenantSlug, setTokens } = useAuthStore.getState();
  const url = getReportExportUrl(type, filter);

  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  if (tenantSlug) headers['X-Tenant-Slug'] = tenantSlug;

  let res = await fetch(url, { headers });

  if (res.status === 401 && refreshToken) {
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setTokens(data.accessToken, data.refreshToken);
        headers.Authorization = `Bearer ${data.accessToken}`;
        res = await fetch(url, { headers });
      } else {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        throw new Error('Sesion expirada');
      }
    } catch {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      throw new Error('Sesion expirada');
    }
  }

  if (!res.ok) {
    let detail = 'Error al descargar reporte';
    try {
      const problem = await res.json();
      detail = problem.detail || problem.title || detail;
    } catch {}
    throw new Error(detail);
  }

  const blob = await res.blob();
  const filename = REPORT_FILENAMES[type] || `reporte-${type}.xlsx`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
