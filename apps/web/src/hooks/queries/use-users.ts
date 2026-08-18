'use client';

import { ApiError, api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type Role = 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER';

export interface TenantUser {
  userId: string;
  email: string;
  name?: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface InviteUserInput {
  email: string;
  role?: Role;
}

// ---- Queries ----

export function useUsers() {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<TenantUser[], ApiError>({
    queryKey: ['users'],
    queryFn: () => api.get('/users'),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useUser(id: string | null) {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<TenantUser, ApiError>({
    queryKey: ['user', id],
    queryFn: () => api.get(`/users/${id}`),
    enabled: isAuthenticated && id !== null,
    staleTime: 15_000,
  });
}

// ---- Mutations ----

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation<TenantUser, ApiError, InviteUserInput>({
    mutationFn: (data) => api.post('/users/invite', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation<TenantUser, ApiError, { id: string; role: Role }>({
    mutationFn: ({ id, role }) => api.patch(`/users/${id}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useRemoveUser() {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, ApiError, string>({
    mutationFn: (id) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
