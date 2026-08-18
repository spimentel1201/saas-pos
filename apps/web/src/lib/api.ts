'use client';

import { useAuthStore } from '@/lib/store';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public errors?: unknown,
  ) {
    super(detail);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'method' | 'body'> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params, headers: customHeaders, ...rest } = options;

  const { accessToken, refreshToken, tenantSlug, setTokens } = useAuthStore.getState();

  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    ...(customHeaders as Record<string, string>),
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  if (tenantSlug) {
    headers['X-Tenant-Slug'] = tenantSlug;
  }

  let response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    ...rest,
  });

  if (response.status === 401 && refreshToken) {
    try {
      const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setTokens(data.accessToken, data.refreshToken);

        headers.Authorization = `Bearer ${data.accessToken}`;
        response = await fetch(url.toString(), {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          ...rest,
        });
      } else {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        throw new ApiError(401, 'Sesion expirada');
      }
    } catch {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      throw new ApiError(401, 'Sesion expirada');
    }
  }

  if (!response.ok) {
    let detail = 'Error desconocido';
    let errors: unknown;

    try {
      const problem = await response.json();
      detail = problem.detail || problem.title || detail;
      errors = problem.errors;
    } catch {
      detail = response.statusText;
    }

    throw new ApiError(response.status, detail, errors);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text);
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
