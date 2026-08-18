'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  type PaymentMethod,
  type SaleStatus,
  useSale,
  useVoidSale,
} from '@/hooks/queries/use-sales';
import { datetime, formatPEN } from '@/lib/formatters';
import { ArrowLeft, Printer, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  CREDIT: 'Credito',
  YAPE: 'Yape',
  PLIN: 'Plin',
  MIXED: 'Mixto',
};

const STATUS_STYLES: Record<SaleStatus, { label: string; color: string }> = {
  COMPLETED: {
    label: 'Completada',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  VOID: { label: 'Anulada', color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  RETURNED: { label: 'Devuelta', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  PARTIAL_RETURN: {
    label: 'Devolucion parcial',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
};

export default function SaleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.id as string;

  const { data: sale, isLoading } = useSale(saleId);
  const voidSale = useVoidSale();
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);

  const handleVoid = async () => {
    await voidSale.mutateAsync(saleId);
    setShowVoidConfirm(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-muted-foreground">Venta no encontrada</p>
        <Button variant="link" onClick={() => router.push('/app/reportes')}>
          Volver a reportes
        </Button>
      </div>
    );
  }

  const status = STATUS_STYLES[sale.status];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/app/reportes"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Venta #{sale.numberSeq}</h1>
          <p className="text-sm text-muted-foreground">{datetime(sale.createdAt)}</p>
        </div>
        <Badge variant="secondary" className={status.color}>
          {status.label}
        </Badge>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          {sale.status === 'COMPLETED' && (
            <Button variant="destructive" size="sm" onClick={() => setShowVoidConfirm(true)}>
              <XCircle className="mr-2 h-4 w-4" />
              Anular
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Producto</th>
                    <th className="pb-2 text-right font-medium">Precio</th>
                    <th className="pb-2 text-right font-medium">Cant.</th>
                    <th className="pb-2 text-right font-medium">Impuesto</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, i) => (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-2.5">
                        <p className="font-medium">{item.productId}</p>
                        {item.variantId && (
                          <p className="text-xs text-muted-foreground">{item.variantId}</p>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-mono">{formatPEN(item.unitPrice)}</td>
                      <td className="py-2.5 text-right font-mono">{item.qty}</td>
                      <td className="py-2.5 text-right font-mono">{formatPEN(item.taxAmount)}</td>
                      <td className="py-2.5 text-right font-mono font-medium">
                        {formatPEN(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">{formatPEN(sale.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Impuesto</span>
              <span className="font-mono">{formatPEN(sale.tax)}</span>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Descuento</span>
                <span className="font-mono text-red-500">-{formatPEN(sale.discount)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between text-base font-semibold">
              <span>Total</span>
              <span className="font-mono">{formatPEN(sale.total)}</span>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Pagos</p>
              {sale.payments.map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>{METHOD_LABELS[p.method]}</span>
                  <span className="font-mono">{formatPEN(p.amount)}</span>
                </div>
              ))}
            </div>

            {sale.cashReceived > 0 && (
              <>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Efectivo recibido</span>
                  <span className="font-mono">{formatPEN(sale.cashReceived)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cambio</span>
                  <span className="font-mono">{formatPEN(sale.cashReceived - sale.total)}</span>
                </div>
              </>
            )}

            <Separator />

            <div className="space-y-1 text-xs text-muted-foreground">
              <p>Sucursal: {sale.branchCode}</p>
              <p>Venta ID: {sale.id}</p>
              {sale.cashierSessionId && <p>Sesion caja: {sale.cashierSessionId}</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Void confirmation dialog */}
      {showVoidConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-background p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Anular venta?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Esta accion no se puede deshacer. La venta quedara marcada como anulada.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowVoidConfirm(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleVoid}
                disabled={voidSale.isPending}
              >
                {voidSale.isPending ? 'Anulando...' : 'Anular venta'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
