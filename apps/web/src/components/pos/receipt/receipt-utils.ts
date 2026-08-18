export type ReceiptWidth = '58mm' | '80mm';

export interface ReceiptConfig {
  width: ReceiptWidth;
  businessName: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  ruc?: string;
  footerMessage?: string;
  returnPolicy?: string;
}

export interface ReceiptItem {
  productName: string;
  productSku?: string;
  qty: number;
  unitPrice: number;
  total: number;
  barcode?: string;
}

export interface ReceiptPayment {
  method: string;
  amount: number;
  ref?: string;
}

export interface ReceiptData {
  numberSeq: number;
  branchCode: string;
  cashierName: string;
  createdAt: Date;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payments: ReceiptPayment[];
  customerName?: string;
}

const LOCALE = 'es-PE';

const currencyFmt = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'PEN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const qtyFmt = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return currencyFmt.format(value);
}

export function formatQty(value: number): string {
  return qtyFmt.format(value);
}

export function formatSaleDate(date: Date): string {
  return date.toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatSaleTime(date: Date): string {
  return date.toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatSeqNumber(seq: number): string {
  return String(seq).padStart(8, '0');
}

export function getMaxChars(config: ReceiptConfig): number {
  return config.width === '80mm' ? 48 : 32;
}

export function wrapText(text: string, maxWidth: number): string[] {
  if (text.length <= maxWidth) return [text];
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (current.length + word.length + 1 > maxWidth) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function padRight(text: string, width: number): string {
  return text.length >= width ? text.slice(0, width) : text + ' '.repeat(width - text.length);
}

export function padLeft(text: string, width: number): string {
  return text.length >= width ? text : ' '.repeat(width - text.length) + text;
}

export function centerText(text: string, width: number): string {
  if (text.length >= width) return text.slice(0, width);
  const leftPad = Math.floor((width - text.length) / 2);
  const rightPad = width - text.length - leftPad;
  return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
}

export function buildSeparator(width: number, char = '-'): string {
  return char.repeat(width);
}

export function getPaymentLabel(method: string): string {
  const labels: Record<string, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
    CREDIT: 'Crédito',
    YAPE: 'Yape',
    PLIN: 'Plin',
    MIXED: 'Mixto',
  };
  return labels[method] ?? method;
}
