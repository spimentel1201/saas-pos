'use client';

import { ApiError, api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface Product {
  id: string;
  tenantId: string;
  categoryId?: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  type: 'GOOD' | 'SERVICE' | 'BUNDLE';
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  price: number;
  cost: number;
  taxRate: number;
  trackStock: boolean;
  stock: number;
  minStock: number;
  maxStock?: number;
  variants: Record<string, unknown>[];
  images: Record<string, unknown>[];
  tags: string[];
  isLowStock: boolean;
  isOutOfStock: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface Category {
  id: string;
  tenantId: string;
  parentId?: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductQueryParams {
  query?: string;
  categoryId?: string;
  type?: 'GOOD' | 'SERVICE' | 'BUNDLE';
  status?: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  minPrice?: number;
  maxPrice?: number;
  hasStock?: boolean;
  lowStock?: boolean;
  tags?: string[];
  sortBy?: 'name' | 'sku' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export function useProducts(params: ProductQueryParams = {}) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<PaginatedResponse<Product>, ApiError>({
    queryKey: ['catalog', 'products', params],
    queryFn: () =>
      api.get('/catalog/products', {
        params: params as Record<string, string | number | boolean | undefined>,
      }),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });
}

export function useProduct(id: string) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<Product, ApiError>({
    queryKey: ['catalog', 'products', id],
    queryFn: () => api.get(`/catalog/products/${id}`),
    enabled: isAuthenticated && !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation<Product, ApiError, Record<string, unknown>>({
    mutationFn: (data) => api.post('/catalog/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation<Product, ApiError, { id: string; data: Record<string, unknown> }>({
    mutationFn: ({ id, data }) => api.patch(`/catalog/products/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products', id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) => api.delete(`/catalog/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] });
    },
  });
}

export function useUpdateProductStatus() {
  const queryClient = useQueryClient();

  return useMutation<Product, ApiError, { id: string; status: string }>({
    mutationFn: ({ id, status }) => api.patch(`/catalog/products/${id}/status`, { status }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['catalog', 'products', id] });
    },
  });
}
