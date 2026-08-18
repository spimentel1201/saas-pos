'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useRef, useState } from 'react';
import { Receipt } from './receipt';
import type { ReceiptConfig, ReceiptData, ReceiptWidth } from './receipt-utils';

interface ReceiptPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: ReceiptConfig;
  data: ReceiptData;
  onPrint: () => void;
}

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

export function ReceiptPreview({
  open,
  onOpenChange,
  config,
  data,
  onPrint,
}: ReceiptPreviewProps) {
  const [width, setWidth] = useState<ReceiptWidth>(config.width);
  const previewRef = useRef<HTMLDivElement>(null);

  const previewConfig: ReceiptConfig = { ...config, width };

  const handlePrintWindow = () => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow || !previewRef.current) return;

    const receiptHTML = previewRef.current.querySelector('.receipt')?.outerHTML ?? '';
    printWindow.document.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Ticket</title>
<style>${RECEIT_CSS}</style></head><body>${receiptHTML}</body></html>`);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Vista Previa del Ticket</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Ancho:</span>
          <Button
            variant={width === '58mm' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setWidth('58mm')}
          >
            58mm
          </Button>
          <Button
            variant={width === '80mm' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setWidth('80mm')}
          >
            80mm
          </Button>
        </div>

        <Separator />

        <div ref={previewRef} className="flex justify-center overflow-auto bg-gray-100 p-4 dark:bg-gray-800">
          <Receipt config={previewConfig} data={data} />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button className="flex-1" onClick={handlePrintWindow}>
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
