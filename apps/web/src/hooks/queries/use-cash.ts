'use client';

import { ApiError, api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type CashSessionStatus = 'OPEN' | 'CLOSED' | 'RECONCILING';
export type CashMovementType = 'IN' | 'OUT' | 'SALE' | 'REFUND';

export interface CashSession {
  id: number;
  branchCode: string;
  userId: string;
  openedAt: string;
  closedAt?: string;
  openingBalance: number;
  expectedBalance: number;
  countedBalance?: number;
  difference?: number;
  status: CashSessionStatus;
  notes?: string;
}

export interface CashMovement {
  id: number;
  sessionId: number;
  type: CashMovementType;
  amount: number;
  reason?: string;
  createdAt: string;
}

export interface Arqueo {
  sessionId: number;
  branchCode: string;
  status: string;
  openingBalance: number;
  expectedBalance: number;
  movements: CashMovement[];
  summary: {
    sales: number;
    ins: number;
    outs: number;
    refunds: number;
  };
}

export interface CashSessionParams {
  branchCode?: string;
  status?: CashSessionStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedCashSessions {
  data: CashSession[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---- Queries ----

export function useCashSessions(params: CashSessionParams = {}) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<PaginatedCashSessions, ApiError>({
    queryKey: ['cash', 'sessions', params],
    queryFn: () =>
      api.get('/cash', {
        params: params as Record<string, string | number | undefined>,
      }),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useCashSession(id: number | null) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<CashSession, ApiError>({
    queryKey: ['cash', 'session', id],
    queryFn: () => api.get(`/cash/${id}`),
    enabled: isAuthenticated && id !== null,
    staleTime: 15_000,
  });
}

export function useOpenSessionByBranch(branchCode: string) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<CashSession, ApiError>({
    queryKey: ['cash', 'open', branchCode],
    queryFn: () => api.get(`/cash/open/${branchCode}`),
    enabled: isAuthenticated && !!branchCode,
    staleTime: 15_000,
    retry: false,
  });
}

export function useCashArqueo(id: number | null) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<Arqueo, ApiError>({
    queryKey: ['cash', 'arqueo', id],
    queryFn: () => api.get(`/cash/${id}/arqueo`),
    enabled: isAuthenticated && id !== null,
    staleTime: 10_000,
  });
}

export function useCashMovements(id: number | null) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<CashMovement[], ApiError>({
    queryKey: ['cash', 'movements', id],
    queryFn: () => api.get(`/cash/${id}/movements`),
    enabled: isAuthenticated && id !== null,
    staleTime: 15_000,
  });
}

// ---- Mutations ----

export function useOpenCashSession() {
  const queryClient = useQueryClient();

  return useMutation<CashSession, ApiError, { branchCode: string; openingBalance: number }>({
    mutationFn: (data) => api.post('/cash/open', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      queryClient.invalidateQueries({ queryKey: ['cash', 'open', variables.branchCode] });
    },
  });
}

export function useCloseCashSession() {
  const queryClient = useQueryClient();

  return useMutation<
    CashSession,
    ApiError,
    { sessionId: number; countedBalance: number; notes?: string }
  >({
    mutationFn: ({ sessionId, ...data }) => api.patch(`/cash/${sessionId}/close`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cash'] });
      queryClient.invalidateQueries({ queryKey: ['cash', 'session', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['cash', 'arqueo', variables.sessionId] });
    },
  });
}

export function useAddCashMovement() {
  const queryClient = useQueryClient();

  return useMutation<
    CashMovement,
    ApiError,
    { sessionId: number; type: CashMovementType; amount: number; reason?: string }
  >({
    mutationFn: ({ sessionId, ...data }) => api.post(`/cash/${sessionId}/movements`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['cash', 'movements', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['cash', 'arqueo', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['cash', 'session', variables.sessionId] });
    },
  });
}
