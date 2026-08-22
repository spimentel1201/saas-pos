'use client';

import {
  type Category,
  type PaginatedResponse,
  type Product,
  type ProductQueryParams,
  useProducts,
} from '@/hooks/queries/use-catalog';
import { useOnlineStatus } from '@/hooks/use-offline';
import { ApiError, api } from '@/lib/api';
import { type OfflineProduct, getCachedProducts } from '@/lib/db';
import {
  type OfflineCategory,
  cacheCategories,
  cacheProducts,
  getCachedCategories,
} from '@/lib/db';
import { useAuthStore } from '@/lib/store';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

/**
 * Products hook that falls back to Dexie cache when offline or API fails.
 * Returns the same shape as useProducts but with offline data as fallback.
 */
export function useOfflineProducts(params: ProductQueryParams = {}) {
  const query = useProducts(params);
  const isOnline = useOnlineStatus();

  const cachedQuery = useQuery({
    queryKey: ['offline', 'products'],
    queryFn: getCachedProducts,
    staleTime: 5 * 60 * 1000,
  });

  // If API failed and we're offline, use cached data
  const isOffline = !isOnline || (query.isError && !query.isLoading);
  const cachedProducts = cachedQuery.data ?? [];

  const mappedProducts: Product[] = cachedProducts
    .filter((p) => p.active)
    .map((p) => ({
      id: p.id,
      tenantId: '',
      categoryId: p.categoryId,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      type: 'GOOD' as const,
      status: 'ACTIVE' as const,
      price: p.price,
      cost: p.costPrice,
      taxRate: p.taxRate,
      trackStock: true,
      stock: Object.values(p.stock).reduce((a, b) => a + b, 0),
      minStock: 0,
      variants: [],
      images: p.imageUrl ? [{ url: p.imageUrl }] : [],
      tags: [],
      isLowStock: false,
      isOutOfStock: Object.values(p.stock).reduce((a, b) => a + b, 0) <= 0,
      createdAt: new Date(p.cachedAt).toISOString(),
      updatedAt: new Date(p.cachedAt).toISOString(),
      createdBy: '',
    }));

  return {
    data: isOffline
      ? ({
          data: mappedProducts,
          total: mappedProducts.length,
          page: 1,
          limit: 200,
          totalPages: 1,
        } as PaginatedResponse<Product>)
      : query.data,
    isLoading: query.isLoading && !isOffline ? true : cachedQuery.isLoading && isOffline,
    isError: isOffline ? false : query.isError,
    isOffline,
  };
}

/**
 * Categories hook that falls back to Dexie cache when offline.
 */
export function useOfflineCategories() {
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  const query = useQuery<Category[], ApiError>({
    queryKey: ['catalog', 'categories'],
    queryFn: () => api.get('/catalog/categories'),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const cachedQuery = useQuery({
    queryKey: ['offline', 'categories'],
    queryFn: getCachedCategories,
    staleTime: 5 * 60 * 1000,
  });

  const isOnline = useOnlineStatus();
  const isOffline = !isOnline || (query.isError && !query.isLoading);

  const cachedCategories: OfflineCategory[] = cachedQuery.data ?? [];

  return {
    data: isOffline
      ? cachedCategories.map((c) => ({
          id: c.id,
          tenantId: '',
          name: c.name,
          description: c.description,
          sortOrder: 0,
          isActive: true,
          createdAt: new Date(c.cachedAt).toISOString(),
          updatedAt: new Date(c.cachedAt).toISOString(),
        }))
      : query.data,
    isLoading: query.isLoading && !isOffline ? true : cachedQuery.isLoading && isOffline,
    isOffline,
  };
}

/**
 * Syncs catalog data to Dexie cache on successful API fetch.
 * Call once at app root (e.g., in layout or POS page).
 */
export function useCatalogCacheSync() {
  const isOnline = useOnlineStatus();
  const isAuthenticated = useAuthStore((s) => !!s.accessToken);

  useEffect(() => {
    if (!isOnline || !isAuthenticated) return;

    const sync = async () => {
      try {
        const [products, categories] = await Promise.all([
          api.get<{ data: OfflineProduct[] }>('/catalog/products', { params: { limit: 1000 } }),
          api.get<OfflineCategory[]>('/catalog/categories'),
        ]);

        const productList = Array.isArray(products)
          ? products
          : ((products as Record<string, unknown>).data ?? []);
        await cacheProducts(productList as OfflineProduct[]);
        await cacheCategories(categories as OfflineCategory[]);
      } catch {
        // Silent fail — cache will be stale but app still works
      }
    };

    sync();
  }, [isOnline, isAuthenticated]);
}
