'use client';

import { Button } from '@/components/ui/button';
import { useConfig } from '@/hooks/queries/use-config';
import type { PaymentMethod } from '@/hooks/queries/use-sales';
import { useUser } from '@/hooks/use-auth';
import { formatPEN } from '@/lib/formatters';
import { CheckCircle2, Eye, Printer } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { Receipt, type ReceiptConfig, type ReceiptData, ReceiptPreview } from './receipt';

interface CheckoutSuccessProps {
  saleId: string;
  saleNumber: number;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  paymentMethod: PaymentMethod;
  branchCode: string;
  items: {
    productName: string;
    productSku?: string;
    qty: number;
    unitPrice: number;
    total: number;
  }[];
  payments: {
    method: string;
    amount: number;
    ref?: string;
  }[];
  createdAt: string;
  onClose: () => void;
  isQueued?: boolean;
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
  CREDIT: 'Crédito',
  YAPE: 'Yape',
  PLIN: 'Plin',
  MIXED: 'Mixto',
};

const RECEIT_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #fff; }
  .receipt {
    font-family: 'Courier New', 'Liberation Mono', monospace;
    font-size: 10px;
    line-height: 1.3;
    color: #000;
    background: #fff;
    white-space: pre;
    overflow: hidden;
  }
  .receipt--58mm { width: 58mm; padding: 2mm; }
  .receipt--80mm { width: 80mm; padding: 3mm; }
  .receipt-header { text-align: center; margin-bottom: 4px; }
  .receipt-logo { max-width: 40mm; max-height: 15mm; object-fit: contain; margin: 0 auto 2mm; display: block; }
  .receipt-business { font-size: 12px; font-weight: bold; }
  .receipt-address, .receipt-phone, .receipt-ruc { font-size: 9px; }
  .receipt-title { font-size: 11px; font-weight: bold; text-align: center; margin: 4px 0; text-transform: uppercase; }
  .receipt-info { font-size: 9px; margin-bottom: 4px; }
  .receipt-separator { border: none; border-top: 1px dashed #000; margin: 4px 0; }
  .receipt-items { margin: 4px 0; }
  .receipt-item { margin-bottom: 3px; }
  .receipt-item-row { display: flex; justify-content: space-between; align-items: baseline; }
  .receipt-item-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .receipt-item-qty-price { flex-shrink: 0; margin-left: 2mm; }
  .receipt-item-sub { font-size: 8px; color: #444; }
  .receipt-totals { margin: 4px 0; }
  .receipt-total-row { display: flex; justify-content: space-between; font-size: 9px; }
  .receipt-total-row--grand { font-size: 12px; font-weight: bold; border-top: 1px dashed #000; padding-top: 2px; margin-top: 2px; }
  .receipt-payments { margin: 4px 0; }
  .receipt-footer { text-align: center; margin-top: 6px; font-size: 9px; }
  .receipt-qr { text-align: center; margin: 4mm auto; }
  .receipt-qr img { width: 25mm; height: 25mm; display: block; margin: 0 auto; }
  .receipt-barcode { text-align: center; margin: 2mm auto; }
  .receipt-barcode img { height: 8mm; display: block; margin: 0 auto; }
  @page { margin: 0; size: auto; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

export function CheckoutSuccess({
  // biome-ignore lint/correctness/noUnusedVariables: kept for future use
  saleId,
  saleNumber,
  total,
  subtotal,
  tax,
  discount,
  paymentMethod,
  branchCode,
  items,
  payments,
  createdAt,
  onClose,
  isQueued,
}: CheckoutSuccessProps) {
  const { data: config } = useConfig();
  const { data: user } = useUser();
  const receiptRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const ticketHeader = config?.find((s) => s.key === 'ticket_header')?.value as
    | { businessName?: string; logoUrl?: string; address?: string; phone?: string; ruc?: string }
    | undefined;
  const ticketFooter = config?.find((s) => s.key === 'ticket_footer')?.value as
    | { message?: string; returnPolicy?: string }
    | undefined;
  const ticketWidth = (config?.find((s) => s.key === 'ticket_width')?.value as string) ?? '58mm';

  const receiptConfig: ReceiptConfig = {
    width: ticketWidth === '80mm' ? '80mm' : '58mm',
    businessName: ticketHeader?.businessName ?? '',
    logoUrl: ticketHeader?.logoUrl ?? undefined,
    address: ticketHeader?.address ?? undefined,
    phone: ticketHeader?.phone ?? undefined,
    ruc: ticketHeader?.ruc ?? undefined,
    footerMessage: ticketFooter?.message ?? '¡Gracias por su compra!',
    returnPolicy: ticketFooter?.returnPolicy ?? undefined,
  };

  const receiptData: ReceiptData = {
    numberSeq: saleNumber,
    branchCode,
    cashierName: user?.name ?? user?.email ?? 'Cajero',
    createdAt: new Date(createdAt),
    items: items.map((i) => ({
      productName: i.productName,
      productSku: i.productSku,
      qty: i.qty,
      unitPrice: i.unitPrice,
      total: i.total,
    })),
    subtotal,
    tax,
    discount,
    total,
    payments,
  };

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) return;

    const receiptEl = receiptRef.current;
    if (!receiptEl) return;

    const receiptHTML = receiptEl.querySelector('.receipt')?.outerHTML ?? receiptEl.innerHTML;

    printWindow.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Venta #${saleNumber}</title>
<style>${RECEIT_CSS}</style></head><body>${receiptHTML}</body></html>`);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  }, [saleNumber]);

  return (
    <>
      <div className="flex flex-col items-center py-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>

        <h2 className="text-xl font-semibold">
          {isQueued ? '¡Venta en cola!' : '¡Venta registrada!'}
        </h2>

        {isQueued && (
          <p className="mt-2 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            Se sincronizará cuando vuelva la conexión
          </p>
        )}

        <div className="mt-4 space-y-1 text-sm text-muted-foreground">
          {!isQueued && (
            <p>
              Venta N° <span className="font-mono font-medium text-foreground">#{saleNumber}</span>
            </p>
          )}
          <p>
            Método:{' '}
            <span className="font-medium text-foreground">{METHOD_LABELS[paymentMethod]}</span>
          </p>
        </div>

        <div className="mt-4 rounded-lg bg-muted px-6 py-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{formatPEN(total)}</p>
        </div>

        <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row">
          <Button className="w-full sm:order-2 sm:flex-1" onClick={onClose}>
            {isQueued ? 'Entendido' : 'Nueva Venta'}
          </Button>
          {!isQueued && (
            <>
              <Button
                variant="outline"
                className="w-full sm:order-1 sm:flex-1"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Vista Previa
              </Button>
              <Button
                variant="outline"
                className="w-full sm:order-3 sm:flex-1"
                onClick={handlePrint}
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimir
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Hidden receipt for print window extraction */}
      <div ref={receiptRef} style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -1 }}>
        <Receipt config={receiptConfig} data={receiptData} />
      </div>

      {/* Preview modal */}
      <ReceiptPreview
        open={showPreview}
        onOpenChange={setShowPreview}
        config={receiptConfig}
        data={receiptData}
        onPrint={handlePrint}
      />
    </>
  );
}
