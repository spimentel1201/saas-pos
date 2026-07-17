import { SaleItem, Sale, type PaymentMethod } from '../entities/sale.entity.js';

export interface SaleTotals {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

export function computeSaleTotals(
  items: SaleItem[],
  globalDiscount: number = 0,
): SaleTotals {
  let subtotal = 0;
  let tax = 0;
  let discount = 0;
  for (const item of items) {
    subtotal += item.qty * item.unitPrice;
    tax += item.taxAmount;
    discount += item.discount;
  }
  discount += globalDiscount;
  const total = round4(subtotal + tax - discount);
  return {
    subtotal: round4(subtotal),
    tax: round4(tax),
    discount: round4(discount),
    total,
  };
}

export function computeNumberSeq(branchCode: string, dayIso: string, countToday: number): number {
  return countToday + 1;
}

export function sumCashAmount(sale: Sale): number {
  return sale.payments
    .filter(p => p.method === 'CASH')
    .reduce((s, p) => s + p.amount, 0);
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
