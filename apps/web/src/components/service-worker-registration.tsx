'use client';

import { syncCatalogToCache } from '@/hooks/use-offline';
import { useEffect } from 'react';

// Offline-first desactivado temporalmente. Mientras sea true:
// - No se registra el Service Worker (sin cache de assets/API).
// - Se des-registran SW existentes y se borran caches viejos del origen.
// Poner en false para re-activar el offline-first.
const OFFLINE_DISABLED = true;

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    if (OFFLINE_DISABLED) {
      // Desactivar: purgar SW y caches
      void (async () => {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((r) => r.unregister()));
        } catch {}
        try {
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          }
        } catch {}
      })();
      return;
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then((_reg) => {
        // Sync catalog on startup
        syncCatalogToCache();

        // Listen for sync messages from SW
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SYNC_MUTATIONS') {
            // Trigger sync in the app
            window.dispatchEvent(new CustomEvent('pos:sync-mutations'));
          }
        });

        // Periodic sync every 5 minutes
        setInterval(
          () => {
            if (navigator.onLine) {
              syncCatalogToCache();
            }
          },
          5 * 60 * 1000,
        );
      })
      .catch(() => {
        // SW registration failed — app still works, just no offline
      });
  }, []);

  return null;
}
