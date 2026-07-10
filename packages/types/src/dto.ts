import type { PaymentMethod, SaleStatus } from './enums.js';

export interface SaleItemDto {
  productId: string;
  variantId?: string;
  qty: number;
  unitPrice: number;
}

export interface CreateSaleDto {
  branchCode: string;
  items: SaleItemDto[];
  payments: Array<{ method: PaymentMethod; amount: number; ref?: string }>;
  customerId?: string;
  idempotencyKey: string;
}

export interface SaleDto {
  id: string;
  numberSeq: number;
  status: SaleStatus;
  total: number;
  createdAt: string;
}
