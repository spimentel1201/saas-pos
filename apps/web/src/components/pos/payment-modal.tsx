'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCartStore, useCartTotal } from '@/hooks/use-cart';
import { useCheckout, type CheckoutPayment, type PaymentMethod } from '@/hooks/queries/use-sales';
import { formatPEN } from '@/lib/formatters';
import { useState } from 'react';
import { CheckoutSuccess } from './checkout-success';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchCode: string;
  cashierSessionId?: number;
}

export function PaymentModal({ open, onOpenChange, branchCode, cashierSessionId }: PaymentModalProps) {
  const items = useCartStore((s) => s.items);
  const total = useCartTotal();
  const clearCart = useCartStore((s) => s.clearCart);
  const checkout = useCheckout();
  const customerId = useCartStore((s) => s.customerId);

  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [cashAmount, setCashAmount] = useState('');
  const [cardRef, setCardRef] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [yapeRef, setYapeRef] = useState('');
  const [plinRef, setPlinRef] = useState('');
const [showSuccess, setShowSuccess] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [saleResult, setSaleResult] = useState<{
    id: string;
    numberSeq: number;
    items: { productName: string; productSku?: string; qty: number; unitPrice: number; total: number }[];
    payments: { method: string; amount: number; ref?: string }[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    createdAt: string;
  } | null>(null);
  const [isQueued, setIsQueued] = useState(false);

  const cashReceived = parseFloat(cashAmount) || 0;
  const change = cashReceived - total;

  const canPay =
    items.length > 0 &&
    ((method === 'CASH' && cashReceived >= total) ||
      (method === 'CARD') ||
      (method === 'TRANSFER' && transferRef.trim().length > 0) ||
      (method === 'YAPE' && yapeRef.trim().length > 0) ||
      (method === 'PLIN' && plinRef.trim().length > 0));

  const handlePay = async () => {
    setPayError(null);
    const payments: CheckoutPayment[] = [];

    if (method === 'CASH') {
      payments.push({ method: 'CASH', amount: total });
    } else if (method === 'CARD') {
      payments.push({ method: 'CARD', amount: total, ref: cardRef || undefined });
    } else if (method === 'TRANSFER') {
      payments.push({ method: 'TRANSFER', amount: total, ref: transferRef });
    } else if (method === 'YAPE') {
      payments.push({ method: 'YAPE', amount: total, ref: yapeRef });
    } else if (method === 'PLIN') {
      payments.push({ method: 'PLIN', amount: total, ref: plinRef });
    }

    const checkoutPayload = {
      branchCode,
      cashierSessionId,
      customerId,
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.name,
        productSku: item.sku,
        barcode: item.barcode,
        qty: item.qty,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
      })),
      payments,
    };

    try {
      const result = await checkout.mutateAsync(checkoutPayload);
      setSaleResult({
        id: result.id,
        numberSeq: result.numberSeq,
        items: result.items.map((i) => ({
          productName: i.productName,
          productSku: i.productSku,
          barcode: i.barcode,
          qty: i.qty,
          unitPrice: i.unitPrice,
          total: i.total,
        })),
        payments: result.payments.map((p) => ({
          method: p.method,
          amount: p.amount,
          ref: p.ref,
        })),
        subtotal: result.subtotal,
        tax: result.tax,
        discount: result.discount,
        total: result.total,
        createdAt: result.createdAt,
      });
      setShowSuccess(true);
      clearCart();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el pago';
      console.error('[PaymentModal] Checkout error:', err);
      setPayError(msg);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setSaleResult(null);
    setCashAmount('');
    setCardRef('');
    setTransferRef('');
    setYapeRef('');
    setPlinRef('');
    onOpenChange(false);
  };

  if (showSuccess && saleResult) {
    return (
      <Dialog open={open} onOpenChange={handleCloseSuccess}>
        <DialogContent className="sm:max-w-md">
          <CheckoutSuccess
            saleId={saleResult.id}
            saleNumber={saleResult.numberSeq}
            total={saleResult.total}
            subtotal={saleResult.subtotal}
            tax={saleResult.tax}
            discount={saleResult.discount}
            paymentMethod={method}
            branchCode={branchCode}
            items={saleResult.items}
            payments={saleResult.payments}
            createdAt={saleResult.createdAt}
            onClose={handleCloseSuccess}
            isQueued={isQueued}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pago</DialogTitle>
        </DialogHeader>

        {/* Summary */}
        <div className="rounded-lg bg-muted p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total a pagar</span>
            <span className="text-lg font-bold">{formatPEN(total)}</span>
          </div>
        </div>

        {/* Payment method tabs */}
        <Tabs value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="CASH" className="text-xs">Efectivo</TabsTrigger>
            <TabsTrigger value="CARD" className="text-xs">Tarjeta</TabsTrigger>
            <TabsTrigger value="YAPE" className="text-xs">Yape</TabsTrigger>
            <TabsTrigger value="PLIN" className="text-xs">Plin</TabsTrigger>
            <TabsTrigger value="TRANSFER" className="text-xs">Transf.</TabsTrigger>
          </TabsList>

          <TabsContent value="CASH" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="cash-amount">Monto recibido</Label>
              <Input
                id="cash-amount"
                type="number"
                placeholder="0.00"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="text-lg"
                autoFocus
              />
            </div>

            {/* Quick amount buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[total, Math.ceil(total / 10) * 10, Math.ceil(total / 50) * 50].map(
                (amount, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => setCashAmount(amount.toFixed(2))}
                  >
                    {formatPEN(amount)}
                  </Button>
                ),
              )}
            </div>

            {cashReceived >= total && (
              <div className="rounded-lg bg-emerald-500/10 p-3 text-center">
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Cambio</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatPEN(change)}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="CARD" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="card-ref">Referencia (opcional)</Label>
              <Input
                id="card-ref"
                placeholder="Nro. referencia o voucher"
                value={cardRef}
                onChange={(e) => setCardRef(e.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent value="YAPE" className="space-y-4 pt-4">
            <div className="rounded-lg bg-violet-500/10 p-3 text-center">
              <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
                Solicitar nro. de operación de Yape al cliente
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="yape-ref">Nro. de operación *</Label>
              <Input
                id="yape-ref"
                placeholder="Ej: 1234567890"
                value={yapeRef}
                onChange={(e) => setYapeRef(e.target.value)}
                autoFocus
              />
            </div>
          </TabsContent>

          <TabsContent value="PLIN" className="space-y-4 pt-4">
            <div className="rounded-lg bg-sky-500/10 p-3 text-center">
              <p className="text-sm font-medium text-sky-600 dark:text-sky-400">
                Solicitar nro. de operación de Plin al cliente
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plin-ref">Nro. de operación *</Label>
              <Input
                id="plin-ref"
                placeholder="Ej: 1234567890"
                value={plinRef}
                onChange={(e) => setPlinRef(e.target.value)}
                autoFocus
              />
            </div>
          </TabsContent>

          <TabsContent value="TRANSFER" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-ref">Nro. de operación</Label>
              <Input
                id="transfer-ref"
                placeholder="Ingrese nro. de operación"
                value={transferRef}
                onChange={(e) => setTransferRef(e.target.value)}
                autoFocus
              />
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-2" />

        {payError && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {payError}
          </div>
        )}

        <Button
          className="h-12 w-full text-base font-semibold"
          disabled={!canPay || checkout.isPending}
          onClick={handlePay}
        >
          {checkout.isPending ? 'Procesando...' : 'Confirmar Pago'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
