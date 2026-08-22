'use client';

import { ApiError, api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface StockItem {
  id: number;
  branchCode: string;
  productId: string;
  qty: number;
  reserved: number;
  available: number;
  minQty: number;
  maxQty: number;
  avgCost: number;
  version: number;
  isLow: boolean;
  isOverMax: boolean;
  updatedAt: string;
}

export interface Movement {
  id: number;
  stockId: number;
  type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN' | 'LOSS';
  delta: number;
  reason?: string;
  ref?: string;
  branchCode: string;
  userId: string;
  createdAt: string;
}

export interface TransferItem {
  productId: string;
  qty: number;
}

export interface Transfer {
  id: string;
  fromBranch: string;
  toBranch: string;
  status: 'PENDING' | 'SHIPPED' | 'RECEIVED' | 'CANCELED';
  items: TransferItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Stock queries ----

export function useStockByBranch(branchCode: string) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<StockItem[], ApiError>({
    queryKey: ['inventory', 'stock', branchCode],
    queryFn: () => api.get(`/inventory/stock/${branchCode}`),
    enabled: isAuthenticated && !!branchCode,
    staleTime: 30_000,
  });
}

export function useStockByProduct(productId: string) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<StockItem[], ApiError>({
    queryKey: ['inventory', 'stock', 'product', productId],
    queryFn: () => api.get(`/inventory/stock/product/${productId}`),
    enabled: isAuthenticated && !!productId,
    staleTime: 30_000,
  });
}

export function useLowStock(branchCode?: string) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<StockItem[], ApiError>({
    queryKey: ['inventory', 'stock', 'low', branchCode],
    queryFn: () =>
      api.get('/inventory/stock/low/all', {
        params: branchCode ? { branchCode } : undefined,
      }),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useMovements(branchCode: string, productId: string, limit = 50) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<Movement[], ApiError>({
    queryKey: ['inventory', 'movements', branchCode, productId, limit],
    queryFn: () =>
      api.get(`/inventory/movements/${branchCode}/${productId}`, {
        params: { limit },
      }),
    enabled: isAuthenticated && !!branchCode && !!productId,
    staleTime: 30_000,
  });
}

// ---- Stock mutations ----

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation<
    StockItem,
    ApiError,
    {
      branchCode: string;
      productId: string;
      data: { newQty?: number; delta?: number; reason?: string; minQty?: number; maxQty?: number };
    }
  >({
    mutationFn: ({ branchCode, productId, data }) =>
      api.patch(`/inventory/stock/${branchCode}/${productId}/adjust`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'stock'] });
      queryClient.invalidateQueries({
        queryKey: ['inventory', 'movements', variables.branchCode, variables.productId],
      });
    },
  });
}

// ---- Transfer queries ----

export function useTransfers(status?: string) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<Transfer[], ApiError>({
    queryKey: ['inventory', 'transfers', status],
    queryFn: () =>
      api.get('/inventory/transfers', {
        params: status ? { status } : undefined,
      }),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useTransfer(id: string) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<Transfer, ApiError>({
    queryKey: ['inventory', 'transfers', id],
    queryFn: () => api.get(`/inventory/transfers/${id}`),
    enabled: isAuthenticated && !!id,
    staleTime: 30_000,
  });
}

// ---- Transfer mutations ----

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation<
    Transfer,
    ApiError,
    { fromBranch: string; toBranch: string; items: TransferItem[] }
  >({
    mutationFn: (data) => api.post('/inventory/transfers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'transfers'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'stock'] });
    },
  });
}

export function useShipTransfer() {
  const queryClient = useQueryClient();

  return useMutation<Transfer, ApiError, string>({
    mutationFn: (id) => api.patch(`/inventory/transfers/${id}/ship`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'transfers'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'transfers', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'stock'] });
    },
  });
}

export function useReceiveTransfer() {
  const queryClient = useQueryClient();

  return useMutation<Transfer, ApiError, { id: string; unitCosts?: Record<string, number> }>({
    mutationFn: ({ id, unitCosts }) =>
      api.patch(`/inventory/transfers/${id}/receive`, { unitCosts }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'transfers'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'transfers', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'stock'] });
    },
  });
}

export function useCancelTransfer() {
  const queryClient = useQueryClient();

  return useMutation<Transfer, ApiError, string>({
    mutationFn: (id) => api.patch(`/inventory/transfers/${id}/cancel`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'transfers'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'transfers', id] });
    },
  });
}
