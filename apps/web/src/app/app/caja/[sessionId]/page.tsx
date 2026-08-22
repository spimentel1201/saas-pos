'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type CashMovementType,
  useAddCashMovement,
  useCashArqueo,
  useCashMovements,
  useCashSession,
  useCloseCashSession,
} from '@/hooks/queries/use-cash';
import { datetime, formatPEN } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Calculator,
  Clock,
  DollarSign,
  Minus,
  Plus,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';

const MOVEMENT_ICONS: Record<string, typeof TrendingUp> = {
  IN: TrendingUp,
  OUT: TrendingDown,
  SALE: DollarSign,
  REFUND: AlertCircle,
};

const MOVEMENT_COLORS: Record<string, string> = {
  IN: 'text-emerald-500',
  OUT: 'text-red-500',
  SALE: 'text-blue-500',
  REFUND: 'text-amber-500',
};

const MOVEMENT_LABELS: Record<string, string> = {
  IN: 'Entrada',
  OUT: 'Salida',
  SALE: 'Venta',
  REFUND: 'Reembolso',
};

const DENOMINATIONS = [
  { value: 200, label: 'S/. 200', type: 'bill' },
  { value: 100, label: 'S/. 100', type: 'bill' },
  { value: 50, label: 'S/. 50', type: 'bill' },
  { value: 20, label: 'S/. 20', type: 'bill' },
  { value: 10, label: 'S/. 10', type: 'bill' },
  { value: 5, label: 'S/. 5', type: 'coin' },
  { value: 2, label: 'S/. 2', type: 'coin' },
  { value: 1, label: 'S/. 1', type: 'coin' },
  { value: 0.5, label: 'S/. 0.50', type: 'coin' },
];

function ArqueoTab({ sessionId }: { sessionId: number }) {
  const { data: arqueo, isLoading } = useCashArqueo(sessionId);
  const closeSession = useCloseCashSession();
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [notes, setNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  if (isLoading) {
    return <div className="h-40 animate-pulse rounded-lg bg-muted" />;
  }

  if (!arqueo) return null;

  const countedTotal = DENOMINATIONS.reduce((sum, d) => {
    return sum + d.value * (counts[d.value] || 0);
  }, 0);

  const difference = countedTotal - arqueo.expectedBalance;
  const isBalanced = Math.abs(difference) < 0.01;

  const handleClose = async () => {
    try {
      await closeSession.mutateAsync({
        sessionId,
        countedBalance: countedTotal,
        notes: notes || undefined,
      });
      setShowConfirm(false);
    } catch {
      // error handled
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="bg-card">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Apertura</p>
            <p className="text-lg font-semibold">{formatPEN(arqueo.openingBalance)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Ventas</p>
            <p className="text-lg font-semibold text-blue-500">{formatPEN(arqueo.summary.sales)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Entradas</p>
            <p className="text-lg font-semibold text-emerald-500">
              {formatPEN(arqueo.summary.ins)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Salidas</p>
            <p className="text-lg font-semibold text-red-500">{formatPEN(arqueo.summary.outs)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Balance Esperado</span>
          </div>
          <p className="text-2xl font-bold">{formatPEN(arqueo.expectedBalance)}</p>
        </CardContent>
      </Card>

      {/* Denomination breakdown */}
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Conteo de Efectivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {DENOMINATIONS.map((d) => (
              <div key={d.value} className="flex items-center gap-3">
                <span className="w-20 text-sm text-muted-foreground">{d.label}</span>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={counts[d.value] || ''}
                  onChange={(e) =>
                    setCounts((prev) => ({
                      ...prev,
                      [d.value]: Number.parseInt(e.target.value) || 0,
                    }))
                  }
                  className="h-9 w-24 text-center"
                />
                <span className="w-24 text-right text-sm font-medium">
                  {formatPEN(d.value * (counts[d.value] || 0))}
                </span>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Total Contado</span>
            <span className="text-lg font-bold">{formatPEN(countedTotal)}</span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Diferencia</span>
            <span
              className={cn(
                'text-sm font-semibold',
                isBalanced ? 'text-emerald-500' : 'text-amber-500',
              )}
            >
              {difference >= 0 ? '+' : ''}
              {formatPEN(difference)}
              {isBalanced ? ' ✓ Cuadra' : ''}
            </span>
          </div>
        </CardContent>
      </Card>

      {arqueo.status === 'OPEN' && (
        <Button
          className="w-full"
          size="lg"
          disabled={!isBalanced || closeSession.isPending}
          onClick={() => setShowConfirm(true)}
        >
          Cerrar Sesión
        </Button>
      )}

      {/* Confirm close dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Cierre</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de cerrar la sesión? El balance contado es{' '}
              <span className="font-semibold text-foreground">{formatPEN(countedTotal)}</span>.
            </p>
            <div className="space-y-2">
              <Label htmlFor="close-notes">Notas (opcional)</Label>
              <Input
                id="close-notes"
                placeholder="Observaciones del cierre..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" disabled={closeSession.isPending} onClick={handleClose}>
                {closeSession.isPending ? 'Cerrando...' : 'Cerrar Sesión'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MovementsTab({ sessionId }: { sessionId: number }) {
  const { data: movements, isLoading } = useCashMovements(sessionId);
  const addMovement = useAddCashMovement();
  const [openModal, setOpenModal] = useState(false);
  const [type, setType] = useState<CashMovementType>('IN');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleAdd = async () => {
    const value = Number.parseFloat(amount);
    if (Number.isNaN(value) || value <= 0) return;

    try {
      await addMovement.mutateAsync({
        sessionId,
        type,
        amount: value,
        reason: reason || undefined,
      });
      setOpenModal(false);
      setAmount('');
      setReason('');
    } catch {
      // error handled
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setType('IN');
            setOpenModal(true);
          }}
        >
          <Plus className="mr-1 h-3 w-3" />
          Entrada
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setType('OUT');
            setOpenModal(true);
          }}
        >
          <Minus className="mr-1 h-3 w-3" />
          Salida
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : !movements?.length ? (
        <Card className="bg-card">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Clock className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Sin movimientos</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-card">
          <CardContent className="p-0">
            <div className="divide-y">
              {movements.map((m) => {
                const Icon = MOVEMENT_ICONS[m.type] || DollarSign;
                const color = MOVEMENT_COLORS[m.type] || 'text-muted-foreground';
                const isPositive = m.type === 'IN' || m.type === 'SALE' || m.type === 'REFUND';

                return (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <div
                      className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-muted')}
                    >
                      <Icon className={cn('h-4 w-4', color)} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{MOVEMENT_LABELS[m.type]}</p>
                      {m.reason && (
                        <p className="truncate text-xs text-muted-foreground">{m.reason}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          isPositive ? 'text-emerald-500' : 'text-red-500',
                        )}
                      >
                        {isPositive ? '+' : '-'}
                        {formatPEN(m.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{datetime(m.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add movement dialog */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{type === 'IN' ? 'Registrar Entrada' : 'Registrar Salida'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="movement-amount">Monto (S/.)</Label>
              <Input
                id="movement-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="movement-reason">Motivo (opcional)</Label>
              <Input
                id="movement-reason"
                placeholder="Descripción..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              disabled={addMovement.isPending || !amount}
              onClick={handleAdd}
            >
              {addMovement.isPending ? 'Registrando...' : 'Registrar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CajaSessionPage() {
  const params = useParams();
  const sessionId = Number(params.sessionId);

  const { data: session, isLoading } = useCashSession(sessionId);

  if (isLoading) {
    return (
      <div className="flex-1 p-4 md:p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">Sesión no encontrada</p>
      </div>
    );
  }

  const statusConfig = {
    OPEN: { label: 'Abierta', color: 'bg-emerald-500/10 text-emerald-500' },
    CLOSED: { label: 'Cerrada', color: 'bg-muted text-muted-foreground' },
    RECONCILING: { label: 'Conciliando', color: 'bg-amber-500/10 text-amber-500' },
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
          <Link href="/app/caja">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver
          </Link>
        </Button>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Sesión #{session.id}</h1>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  statusConfig[session.status].color,
                )}
              >
                {statusConfig[session.status].label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {session.branchCode} · {datetime(session.openedAt)}
              {session.closedAt && ` — ${datetime(session.closedAt)}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Apertura</p>
              <p className="text-lg font-semibold">{formatPEN(session.openingBalance)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="arqueo">
        <TabsList>
          <TabsTrigger value="arqueo">
            <Calculator className="mr-1 h-3 w-3" />
            Arqueo
          </TabsTrigger>
          <TabsTrigger value="movements">
            <Banknote className="mr-1 h-3 w-3" />
            Movimientos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="arqueo" className="mt-4">
          <ArqueoTab sessionId={sessionId} />
        </TabsContent>

        <TabsContent value="movements" className="mt-4">
          <MovementsTab sessionId={sessionId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
