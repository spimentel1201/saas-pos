import type {
  PaymentMethod,
  Sale,
  SaleDTO,
  SaleItem,
  SaleReturn,
  SaleStatus,
} from '../../domain/entities/sale.entity.js';

export interface SaleWithLines {
  sale: {
    id: string;
    branchCode: string;
    userId: string;
    cashierSessionId?: number;
    numberSeq: number;
    customerId?: string;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    status: SaleStatus;
    meta: Record<string, unknown>;
    createdAt: Date;
  };
  items: SaleItem[];
  payments: { method: PaymentMethod; amount: number; ref?: string }[];
}

export interface CheckoutInput {
  saleId: string;
  branchCode: string;
  userId: string;
  cashierSessionId?: number;
  customerId?: string;
  items: SaleItem[];
  payments: { method: PaymentMethod; amount: number; ref?: string }[];
  totals: { subtotal: number; tax: number; discount: number; total: number; numberSeq: number };
  meta?: Record<string, unknown>;
}

export interface SaleFilter {
  branchCode?: string;
  userId?: string;
  from?: Date;
  to?: Date;
  status?: SaleStatus;
  customerId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'total';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedSales {
  data: SaleDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ReturnInput {
  returnId: string;
  saleId: string;
  reason?: string;
  items: SaleItem[];
  total: number;
}

export interface SaleRepositoryPort {
  nextNumberSeq(branchCode: string, date: Date): Promise<number>;
  checkout(input: CheckoutInput): Promise<Sale>;
  findById(id: string): Promise<Sale | null>;
  findAll(filter: SaleFilter): Promise<PaginatedSales>;
  findTodaysCount(branchCode: string, date: Date): Promise<number>;
  registerReturn(input: ReturnInput): Promise<SaleReturn>;
  listReturns(saleId: string): Promise<SaleReturn[]>;
  voidSale(id: string): Promise<void>;
}

export const SALE_REPO = Symbol('SALE_REPO');
export const TENANT_SCHEMA = Symbol('TENANT_SCHEMA');
