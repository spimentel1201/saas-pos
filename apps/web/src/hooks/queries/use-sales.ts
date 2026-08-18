'use client';

import { ApiError, api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type SaleStatus = 'COMPLETED' | 'VOID' | 'RETURNED' | 'PARTIAL_RETURN';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT' | 'YAPE' | 'PLIN' | 'MIXED';

export interface SaleItem {
  productId: string;
  productName: string;
  productSku?: string;
  barcode?: string;
  variantId?: string;
  qty: number;
  unitPrice: number;
  taxAmount: number;
  discount: number;
  total: number;
}

export interface SalePayment {
  method: PaymentMethod;
  amount: number;
  ref?: string;
}

export interface Sale {
  id: string;
  branchCode: string;
  userId: string;
  cashierSessionId?: number;
  numberSeq: number;
  customerId?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: SaleStatus;
  meta: Record<string, unknown>;
  items: SaleItem[];
  payments: SalePayment[];
  cashReceived: number;
  createdAt: string;
}

export interface SaleReturn {
  id: string;
  saleId: string;
  reason?: string;
  items: SaleItem[];
  total: number;
  createdAt: string;
}

export interface SaleQueryParams {
  branchCode?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: SaleStatus;
  customerId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedSales {
  data: Sale[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---- Queries ----

export function useSales(params: SaleQueryParams = {}) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<PaginatedSales, ApiError>({
    queryKey: ['sales', params],
    queryFn: () =>
      api.get('/sales', {
        params: params as Record<string, string | number | undefined>,
      }),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useSale(id: string) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<Sale, ApiError>({
    queryKey: ['sales', id],
    queryFn: () => api.get(`/sales/${id}`),
    enabled: isAuthenticated && !!id,
    staleTime: 30_000,
  });
}

export function useSaleReturns(id: string) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<SaleReturn[], ApiError>({
    queryKey: ['sales', id, 'returns'],
    queryFn: () => api.get(`/sales/${id}/returns`),
    enabled: isAuthenticated && !!id,
    staleTime: 30_000,
  });
}

// ---- Mutations ----

export interface CheckoutItem {
  productId: string;
  productName: string;
  productSku?: string;
  barcode?: string;
  variantId?: string;
  qty: number;
  unitPrice: number;
  taxRate?: number;
  discount?: number;
}

export interface CheckoutPayment {
  method: PaymentMethod;
  amount: number;
  ref?: string;
}

export function useCheckout() {
  const queryClient = useQueryClient();

  return useMutation<
    Sale,
    ApiError,
    {
      branchCode: string;
      customerId?: string;
      cashierSessionId?: number;
      items: CheckoutItem[];
      payments: CheckoutPayment[];
      meta?: Record<string, unknown>;
    }
  >({
    mutationFn: (data) => api.post('/sales/checkout', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['cash', 'arqueo'] });
      queryClient.invalidateQueries({ queryKey: ['cash', 'movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'stock'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] });
    },
  });
}

export function useVoidSale() {
  const queryClient = useQueryClient();

  return useMutation<{ id: string; status: string }, ApiError, string>({
    mutationFn: (id) => api.patch(`/sales/${id}/void`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales', id] });
    },
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();

  return useMutation<
    SaleReturn,
    ApiError,
    {
      saleId: string;
      reason?: string;
      items: CheckoutItem[];
    }
  >({
    mutationFn: (data) => api.post('/sales/returns', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'stock'] });
    },
  });
}
