'use client';

import { ApiError, api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

interface LoginInput {
  email: string;
  password: string;
}

interface SignupInput {
  businessName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  userName: string;
  userEmail: string;
  primaryRole: string;
  tenantSlug: string;
  tenants?: Array<{ slug: string; role: string; name: string }>;
}

interface UserResponse {
  id: string;
  email: string;
  name: string;
  emailVerified: string | null;
  tenants: Array<{ slug: string; role: string; name: string }>;
}

export function useLogin() {
  const queryClient = useQueryClient();
  const setTokens = useAuthStore((s) => s.setTokens);

  return useMutation<AuthResponse, ApiError, LoginInput>({
    mutationFn: (data) => api.post('/auth/login', data),
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      useAuthStore.setState({
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        tenantSlug: data.tenantSlug,
        role: data.primaryRole,
      });
      queryClient.clear();
      window.location.href = '/app';
    },
  });
}

export function useSignup() {
  const queryClient = useQueryClient();
  const setTokens = useAuthStore((s) => s.setTokens);

  return useMutation<AuthResponse, ApiError, SignupInput>({
    mutationFn: (data) => api.post('/auth/signup', data),
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      useAuthStore.setState({
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        tenantSlug: data.tenantSlug,
        role: data.primaryRole,
      });
      queryClient.clear();
      window.location.href = '/app';
    },
  });
}

export function useUser() {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  return useQuery<UserResponse, ApiError>({
    queryKey: ['auth', 'me'],
    queryFn: () => api.get('/auth/me'),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  return useCallback(() => {
    api.post('/auth/logout').catch(() => {});
    logout();
    queryClient.clear();
    router.push('/login');
  }, [logout, queryClient, router]);
}
