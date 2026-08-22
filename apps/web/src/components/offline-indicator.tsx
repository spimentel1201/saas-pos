'use client';

import { Badge } from '@/components/ui/badge';
import {
  useOnlineStatus,
  usePendingMutationsCount,
  useSyncPendingMutations,
} from '@/hooks/use-offline';
import { CloudOff, Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const pendingCount = usePendingMutationsCount();
  const sync = useSyncPendingMutations();
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleSync = () => sync();
    window.addEventListener('pos:sync-mutations', handleSync);
    return () => window.removeEventListener('pos:sync-mutations', handleSync);
  }, [sync]);

  const handleSync = async () => {
    if (syncing || !isOnline) return;
    setSyncing(true);
    await sync();
    setSyncing(false);
  };

  if (isOnline && pendingCount === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {!isOnline && (
        <Badge
          variant="outline"
          className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-400"
        >
          <CloudOff className="h-3 w-3" />
          Offline
        </Badge>
      )}
      {pendingCount > 0 && (
        <Badge
          variant="outline"
          className={`gap-1 ${isOnline ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' : 'border-amber-500/30 bg-amber-500/10 text-amber-400'}`}
        >
          {syncing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3 cursor-pointer" onClick={handleSync} />
          )}
          {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
        </Badge>
      )}
    </div>
  );
}
