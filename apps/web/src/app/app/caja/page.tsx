'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { type CashSession, useCashSessions, useOpenCashSession } from '@/hooks/queries/use-cash';
import { useBranches } from '@/hooks/queries/use-config';
import { ApiError } from '@/lib/api';
import { formatPEN } from '@/lib/formatters';
import { datetime } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { AlertCircle, ArrowRight, CheckCircle2, Clock, Plus, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const STATUS_CONFIG = {
  OPEN: { label: 'Abierta', variant: 'default' as const, icon: Clock, color: 'text-emerald-500' },
  CLOSED: {
    label: 'Cerrada',
    variant: 'secondary' as const,
    icon: CheckCircle2,
    color: 'text-muted-foreground',
  },
  RECONCILING: {
    label: 'Conciliando',
    variant: 'outline' as const,
    icon: AlertCircle,
    color: 'text-amber-500',
  },
};

function SessionCard({ session }: { session: CashSession }) {
  const config = STATUS_CONFIG[session.status];
  const Icon = config.icon;

  return (
    <Card className="bg-card transition-colors hover:bg-muted/50">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-muted')}>
              <Icon className={cn('h-5 w-5', config.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Sesión #{session.id}</span>
                <Badge variant={config.variant} className="text-xs">
                  {config.label}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {session.branchCode} · {datetime(session.openedAt)}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium">{formatPEN(session.openingBalance)}</p>
            <p className="text-xs text-muted-foreground">Apertura</p>
          </div>
        </div>

        {session.status === 'OPEN' && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <div>
              <p className="text-xs text-muted-foreground">Balance Esperado</p>
              <p className="text-sm font-semibold">{formatPEN(session.expectedBalance)}</p>
            </div>
            <Button asChild size="sm">
              <Link href={`/app/caja/${session.id}`}>
                Ver Detalle
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        )}

        {session.status === 'CLOSED' && session.difference !== undefined && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <div>
              <p className="text-xs text-muted-foreground">Diferencia</p>
              <p
                className={cn(
                  'text-sm font-semibold',
                  Math.abs(session.difference) < 0.01 ? 'text-emerald-500' : 'text-amber-500',
                )}
              >
                {session.difference >= 0 ? '+' : ''}
                {formatPEN(session.difference)}
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={`/app/caja/${session.id}`}>
                Ver Detalle
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CajaPage() {
  const [filter, setFilter] = useState<string>('ALL');
  const [openModal, setOpenModal] = useState(false);
  const [branch, setBranch] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [openError, setOpenError] = useState<string | null>(null);

  const { data: branches, isLoading: branchesLoading } = useBranches();
  const { data, isLoading } = useCashSessions({
    status: filter === 'ALL' ? undefined : (filter as 'OPEN' | 'CLOSED'),
  });
  const openSession = useOpenCashSession();

  // Preselecciona una sucursal real del negocio (nada de valores fijos).
  useEffect(() => {
    const first = branches?.[0]?.code;
    if (!first) return;
    setBranch((prev) => (branches?.some((b) => b.code === prev) ? prev : first));
  }, [branches]);

  const sessions = data?.data ?? [];

  const handleOpen = async () => {
    const balance = Number.parseFloat(openingBalance);
    if (Number.isNaN(balance) || balance < 0) return;
    setOpenError(null);

    try {
      await openSession.mutateAsync({
        branchCode: branch,
        openingBalance: balance,
      });
      setOpenModal(false);
      setOpeningBalance('');
    } catch (err) {
      setOpenError(err instanceof ApiError ? err.detail : 'No se pudo abrir la sesión de caja');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Caja</h1>
          <p className="text-sm text-muted-foreground">Control de sesiones de caja y arqueo</p>
        </div>
        <Button onClick={() => setOpenModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Sesión
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        {['ALL', 'OPEN', 'CLOSED'].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {f === 'ALL' ? 'Todas' : f === 'OPEN' ? 'Abiertas' : 'Cerradas'}
          </button>
        ))}
      </div>

      {/* Sessions list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wallet className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No hay sesiones de caja</p>
            <p className="text-xs text-muted-foreground/70">
              Abre una sesión para comenzar a registrar ventas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}

      {/* Open Session Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Abrir Sesión de Caja</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sucursal</Label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                disabled={branchesLoading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {branchesLoading && <option value="">Cargando sucursales...</option>}
                {!branchesLoading && (branches ?? []).length === 0 && (
                  <option value="">Sin sucursales</option>
                )}
                {(branches ?? []).map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
              {!branchesLoading && (branches ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Crea una sucursal en Configuración → Sucursales para abrir caja.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="opening-balance">Monto Inicial (S/.)</Label>
              <Input
                id="opening-balance"
                type="number"
                placeholder="0.00"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <Separator />

            {openError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {openError}
              </div>
            )}

            <Button
              className="w-full"
              disabled={openSession.isPending || !openingBalance || !branch}
              onClick={handleOpen}
            >
              {openSession.isPending ? 'Abriendo...' : 'Abrir Sesión'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
