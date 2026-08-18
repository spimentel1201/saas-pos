'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useEffect, useState } from 'react';
import {
  addPendingMutation,
  cacheCategories,
  cacheProducts,
  getPendingMutations,
  getPendingMutationsCount,
  removePendingMutation,
  incrementRetries,
  type OfflineProduct,
  type OfflineCategory,
  type PendingMutation,
} from '@/lib/db';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

const MAX_RETRIES = 3;

// ---- Online Status ----

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// ---- Pending Mutations Count ----

export function usePendingMutationsCount() {
  const count = useLiveQuery(() => getPendingMutationsCount(), []) ?? 0;
  return count;
}

// ---- Sync Pending Mutations ----

export function useSyncPendingMutations() {
  const isOnline = useOnlineStatus();

  const sync = useCallback(async () => {
    if (!isOnline) return;

    const mutations = await getPendingMutations();
    if (!mutations.length) return;

    const { accessToken, tenantSlug } = useAuthStore.getState();
    if (!accessToken) return;

    for (const m of mutations) {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        };
        if (tenantSlug) {
          headers['X-Tenant-Slug'] = tenantSlug;
        }

        const response = await fetch(`${API_BASE}${m.path}`, {
          method: m.method,
          headers,
          body: m.body ? JSON.stringify(m.body) : undefined,
        });

        if (response.ok) {
          await removePendingMutation(m.id!);
        } else {
          await incrementRetries(m.id!);
          if (m.retries >= MAX_RETRIES) {
            await removePendingMutation(m.id!);
          }
        }
      } catch {
        await incrementRetries(m.id!);
      }
    }
  }, [isOnline]);

  // Sync when coming online
  useEffect(() => {
    if (isOnline) {
      sync();
    }
  }, [isOnline, sync]);

  return sync;
}

// ---- Queue Mutation ----

export function useQueueMutation() {
  const isOnline = useOnlineStatus();

  const queueMutation = useCallback(
    async (method: 'POST' | 'PATCH' | 'PUT' | 'DELETE', path: string, body?: unknown) => {
      if (isOnline) {
        // Try online first
        try {
          const m = method.toLowerCase() as 'post' | 'patch' | 'put' | 'delete';
          if (m === 'delete') {
            await api.delete(path);
          } else {
            await api[m](path, body);
          }
          return;
        } catch {
          // If fails, queue for later
        }
      }

      // Queue for offline sync
      await addPendingMutation({ method, path, body });
    },
    [isOnline],
  );

  return queueMutation;
}

// ---- Cache Sync ----

export async function syncCatalogToCache(): Promise<void> {
  const isAuthenticated = useAuthStore.getState().accessToken;
  if (!isAuthenticated) return;

  try {
    const [products, categories] = await Promise.all([
      api.get<{ data: OfflineProduct[] }>('/catalog/products', { params: { limit: 1000 } }),
      api.get<OfflineCategory[]>('/catalog/categories'),
    ]);

    const productList = Array.isArray(products) ? products : (products as any).data ?? [];
    await cacheProducts(productList);
    await cacheCategories(categories as OfflineCategory[]);
  } catch {
    // Silent fail — cache will be stale but app still works
  }
}
