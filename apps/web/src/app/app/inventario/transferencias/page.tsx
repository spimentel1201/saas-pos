'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type Transfer, useTransfers } from '@/hooks/queries/use-inventory';
import { ArrowLeft, ArrowRight, ArrowUpDown, Package, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pendiente',
    className: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  SHIPPED: {
    label: 'Enviado',
    className: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  },
  RECEIVED: {
    label: 'Recibido',
    className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  CANCELED: {
    label: 'Cancelado',
    className: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  },
} as const;

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} dias`;

  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
}

export default function TransfersPage() {
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const { data: transfers, isLoading } = useTransfers(statusFilter);

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
          <Link href="/app/inventario">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold sm:text-2xl">Transferencias</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Movimiento de stock entre sucursales
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/app/inventario/transferencias/nueva">
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Nueva</span>
            <span className="sm:hidden">+</span>
          </Link>
        </Button>
      </div>

      <Tabs
        value={statusFilter ?? 'all'}
        onValueChange={(v: string) => setStatusFilter(v === 'all' ? undefined : v)}
      >
        <TabsList className="w-full overflow-x-auto sm:w-auto">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            Todas
          </TabsTrigger>
          <TabsTrigger value="PENDING" className="text-xs sm:text-sm">
            Pendientes
          </TabsTrigger>
          <TabsTrigger value="SHIPPED" className="text-xs sm:text-sm">
            Enviadas
          </TabsTrigger>
          <TabsTrigger value="RECEIVED" className="text-xs sm:text-sm">
            Recibidas
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : !transfers?.length ? (
        <div className="flex h-40 flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <ArrowUpDown className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No hay transferencias</p>
            <p className="text-sm text-muted-foreground">
              Crea una transferencia para mover stock entre sucursales
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/app/inventario/transferencias/nueva">
              <Plus className="mr-2 h-4 w-4" />
              Nueva transferencia
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Mobile: Card list */}
          <div className="flex flex-col gap-2 md:hidden">
            {transfers.map((t) => (
              <TransferCard key={t.id} transfer={t} />
            ))}
          </div>

          {/* Desktop: Table */}
          <Card className="hidden bg-card md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Ruta</th>
                      <th className="px-4 py-3 font-medium">Items</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.map((t) => {
                      const status = STATUS_CONFIG[t.status];
                      return (
                        <tr key={t.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <Link
                              href={`/app/inventario/transferencias/${t.id}`}
                              className="flex items-center gap-2 text-sm font-medium hover:underline"
                            >
                              <span>{t.fromBranch}</span>
                              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{t.toBranch}</span>
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {t.items.length} producto{t.items.length !== 1 ? 's' : ''}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`text-xs ${status?.className}`}>
                              {status?.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {formatDate(t.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground sm:text-sm">
            {transfers.length} transferencia{transfers.length !== 1 ? 's' : ''}
          </p>
        </>
      )}
    </div>
  );
}

function TransferCard({ transfer }: { transfer: Transfer }) {
  const status = STATUS_CONFIG[transfer.status];

  return (
    <Link href={`/app/inventario/transferencias/${transfer.id}`}>
      <div className="rounded-lg border bg-card p-3 transition-colors hover:bg-muted/30 active:bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <span>{transfer.fromBranch}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <span>{transfer.toBranch}</span>
            </div>
          </div>
          <Badge variant="outline" className={`shrink-0 text-[10px] ${status?.className}`}>
            {status?.label}
          </Badge>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" />
            <span>
              {transfer.items.length} producto{transfer.items.length !== 1 ? 's' : ''}
            </span>
          </div>
          <span>{formatDate(transfer.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
