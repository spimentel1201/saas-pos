'use client';

import { ApiError, api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type CustomerType = 'INDIVIDUAL' | 'BUSINESS';
export type DocumentType = 'DNI' | 'RUC' | 'CE' | 'PASSPORT';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: CustomerType;
  documentType?: DocumentType;
  documentNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  taxId?: string;
  creditBalance: number;
  notes?: string;
  active: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  type?: CustomerType;
  documentType?: DocumentType;
  documentNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  taxId?: string;
  notes?: string;
}

export interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  taxId?: string;
  notes?: string;
}

export interface CustomerQueryParams {
  search?: string;
  type?: CustomerType;
  active?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'creditBalance';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedCustomers {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ---- Queries ----

export function useCustomers(params: CustomerQueryParams = {}) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<PaginatedCustomers, ApiError>({
    queryKey: ['customers', params],
    queryFn: () =>
      api.get('/customers', {
        params: params as Record<string, string | number | boolean | undefined>,
      }),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useCustomer(id: string | null) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<Customer, ApiError>({
    queryKey: ['customer', id],
    queryFn: () => api.get(`/customers/${id}`),
    enabled: isAuthenticated && id !== null,
    staleTime: 15_000,
  });
}

export function useCustomerSearch(query: string, limit = 10) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<Customer[], ApiError>({
    queryKey: ['customers', 'search', query, limit],
    queryFn: () => api.get('/customers/search', { params: { q: query, limit } }),
    enabled: isAuthenticated && query.length >= 2,
    staleTime: 10_000,
  });
}

export function useCustomerPurchases(id: string | null, page = 1, limit = 20) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery({
    queryKey: ['customer', 'purchases', id, page, limit],
    queryFn: () => api.get(`/customers/${id}/purchases`, { params: { page, limit } }),
    enabled: isAuthenticated && id !== null,
    staleTime: 30_000,
  });
}

// ---- Mutations ----

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation<Customer, ApiError, CreateCustomerInput>({
    mutationFn: (data) => api.post('/customers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation<Customer, ApiError, { id: string; data: UpdateCustomerInput }>({
    mutationFn: ({ id, data }) => api.patch(`/customers/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] });
    },
  });
}

export function useDeactivateCustomer() {
  const queryClient = useQueryClient();

  return useMutation<Customer, ApiError, string>({
    mutationFn: (id) => api.patch(`/customers/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useAdjustCredit() {
  const queryClient = useQueryClient();

  return useMutation<Customer, ApiError, { id: string; amount: number; reason?: string }>({
    mutationFn: ({ id, ...data }) => api.post(`/customers/${id}/credit`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] });
    },
  });
}
