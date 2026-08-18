'use client';

import { ApiError, api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  timezone: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tax {
  id: string;
  name: string;
  rate: number;
  type: 'PERCENT' | 'EXEMPT' | 'FIXED';
  createdAt: string;
}

export interface TenantSetting {
  id: number;
  key: string;
  value: unknown;
  updatedAt: string;
}

export interface CreateBranchInput {
  name: string;
  code: string;
  address?: string;
  city?: string;
  timezone?: string;
}

export interface UpdateBranchInput {
  name?: string;
  address?: string;
  city?: string;
  timezone?: string;
}

export interface CreateTaxInput {
  name: string;
  rate: number;
  type: 'PERCENT' | 'EXEMPT' | 'FIXED';
}

export interface UpdateTaxInput {
  name?: string;
  rate?: number;
}

// ---- Branches ----

export function useBranches() {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<Branch[], ApiError>({
    queryKey: ['config', 'branches'],
    queryFn: () => api.get('/branches'),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useBranch(id: string | null) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<Branch, ApiError>({
    queryKey: ['config', 'branch', id],
    queryFn: () => api.get(`/branches/${id}`),
    enabled: isAuthenticated && id !== null,
    staleTime: 30_000,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();

  return useMutation<Branch, ApiError, CreateBranchInput>({
    mutationFn: (data) => api.post('/branches', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'branches'] });
    },
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();

  return useMutation<Branch, ApiError, { id: string; data: UpdateBranchInput }>({
    mutationFn: ({ id, data }) => api.patch(`/branches/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'branches'] });
    },
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();

  return useMutation<Branch, ApiError, string>({
    mutationFn: (id) => api.delete(`/branches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'branches'] });
    },
  });
}

// ---- Taxes ----

export function useTaxes() {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<Tax[], ApiError>({
    queryKey: ['config', 'taxes'],
    queryFn: () => api.get('/taxes'),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export function useCreateTax() {
  const queryClient = useQueryClient();

  return useMutation<Tax, ApiError, CreateTaxInput>({
    mutationFn: (data) => api.post('/taxes', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'taxes'] });
    },
  });
}

export function useUpdateTax() {
  const queryClient = useQueryClient();

  return useMutation<Tax, ApiError, { id: string; data: UpdateTaxInput }>({
    mutationFn: ({ id, data }) => api.patch(`/taxes/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'taxes'] });
    },
  });
}

export function useDeleteTax() {
  const queryClient = useQueryClient();

  return useMutation<Tax, ApiError, string>({
    mutationFn: (id) => api.delete(`/taxes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'taxes'] });
    },
  });
}

// ---- Settings ----

export function useSettings() {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<TenantSetting[], ApiError>({
    queryKey: ['config', 'settings'],
    queryFn: () => api.get('/settings'),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

export const useConfig = useSettings;

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation<TenantSetting[], ApiError, Record<string, unknown>>({
    mutationFn: (settings) => api.patch('/settings', { settings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'settings'] });
    },
  });
}

export function useUpdateTicketHeader() {
  const queryClient = useQueryClient();

  return useMutation<TenantSetting[], ApiError, Record<string, string>>({
    mutationFn: (data) => api.patch('/settings/ticket-header', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', 'settings'] });
    },
  });
}
