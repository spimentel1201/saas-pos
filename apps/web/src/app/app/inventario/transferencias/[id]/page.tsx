'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useCancelTransfer,
  useReceiveTransfer,
  useShipTransfer,
  useTransfer,
} from '@/hooks/queries/use-inventory';
import { ArrowLeft, CheckCircle, Send, Truck, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  SHIPPED: 'Enviado',
  RECEIVED: 'Recibido',
  CANCELED: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  SHIPPED: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  RECEIVED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  CANCELED: 'border-red-500/30 bg-red-500/10 text-red-400',
};

export default function TransferDetailPage() {
  const params = useParams();
  const _router = useRouter();
  const transferId = params.id as string;

  const { data: transfer, isLoading } = useTransfer(transferId);
  const shipTransfer = useShipTransfer();
  const receiveTransfer = useReceiveTransfer();
  const cancelTransfer = useCancelTransfer();

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-lg font-medium">Transferencia no encontrada</p>
        <Button asChild>
          <Link href="/app/inventario/transferencias">Volver</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app/inventario/transferencias">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Transferencia</h1>
            <Badge variant="outline" className={`text-xs ${STATUS_COLORS[transfer.status]}`}>
              {STATUS_LABELS[transfer.status]}
            </Badge>
          </div>
          <p className="font-mono text-xs text-muted-foreground">{transfer.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-4 lg:col-span-2">
          {/* Route */}
          <Card className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground">Origen</p>
                  <p className="text-lg font-bold">{transfer.fromBranch}</p>
                </div>
                <Truck className="h-6 w-6 text-muted-foreground" />
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground">Destino</p>
                  <p className="text-lg font-bold">{transfer.toBranch}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Productos ({transfer.items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 font-medium">Producto ID</th>
                    <th className="pb-2 text-right font-medium">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {transfer.items.map((item, idx) => (
                    <tr key={idx} className="border-t border-border/50">
                      <td className="py-2.5 font-mono text-xs">{item.productId}</td>
                      <td className="py-2.5 text-right font-mono text-sm font-medium">
                        {item.qty}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Card className="bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {transfer.status === 'PENDING' && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => shipTransfer.mutate(transferId)}
                    disabled={shipTransfer.isPending}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {shipTransfer.isPending ? 'Enviando...' : 'Enviar (descontar stock)'}
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => cancelTransfer.mutate(transferId)}
                    disabled={cancelTransfer.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {cancelTransfer.isPending ? 'Cancelando...' : 'Cancelar'}
                  </Button>
                </>
              )}

              {transfer.status === 'SHIPPED' && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => receiveTransfer.mutate({ id: transferId })}
                    disabled={receiveTransfer.isPending}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {receiveTransfer.isPending ? 'Recibiendo...' : 'Recibir (sumar stock)'}
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => cancelTransfer.mutate(transferId)}
                    disabled={cancelTransfer.isPending}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {cancelTransfer.isPending ? 'Cancelando...' : 'Cancelar'}
                  </Button>
                </>
              )}

              {(transfer.status === 'RECEIVED' || transfer.status === 'CANCELED') && (
                <p className="text-sm text-muted-foreground text-center">
                  Esta transferencia ya fue{' '}
                  {transfer.status === 'RECEIVED' ? 'recibida' : 'cancelada'}.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Creado por</span>
                <span>{transfer.createdBy}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Fecha creacion</span>
                <span>{new Date(transfer.createdAt).toLocaleString('es-PE')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Ultima actualizacion</span>
                <span>{new Date(transfer.updatedAt).toLocaleString('es-PE')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
