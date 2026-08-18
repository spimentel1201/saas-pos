'use client';

import { ApiError, api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Category } from './use-catalog';

export function useCategories() {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<Category[], ApiError>({
    queryKey: ['catalog', 'categories'],
    queryFn: () => api.get('/catalog/categories'),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });
}

export function useCategory(id: string) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<Category, ApiError>({
    queryKey: ['catalog', 'categories', id],
    queryFn: () => api.get(`/catalog/categories/${id}`),
    enabled: isAuthenticated && !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation<Category, ApiError, { name: string; description?: string; parentId?: string }>(
    {
      mutationFn: (data) => api.post('/catalog/categories', data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['catalog', 'categories'] });
      },
    },
  );
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation<Category, ApiError, { id: string; data: Partial<Category> }>({
    mutationFn: ({ id, data }) => api.patch(`/catalog/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (id) => api.delete(`/catalog/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog', 'categories'] });
    },
  });
}
