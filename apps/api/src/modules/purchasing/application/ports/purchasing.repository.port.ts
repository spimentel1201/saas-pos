import type {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseReceipt,
  Supplier,
} from '../../domain/entities/purchasing.entity.js';

export interface SupplierRepositoryPort {
  findById(id: string): Promise<Supplier | null>;
  findAll(): Promise<Supplier[]>;
  save(supplier: Supplier): Promise<Supplier>;
  delete(id: string): Promise<void>;
}

export interface PurchaseOrderRepositoryPort {
  findById(id: string): Promise<PurchaseOrder | null>;
  findAll(status?: string): Promise<PurchaseOrder[]>;
  save(po: PurchaseOrder): Promise<PurchaseOrder>;
  listReceipts(poId: string): Promise<PurchaseReceipt[]>;
  addReceipt(input: {
    poId: string;
    receivedBy: string;
    items: PurchaseOrderItem[];
  }): Promise<PurchaseReceipt>;
}

export const SUPPLIER_REPO = Symbol('SUPPLIER_REPO');
export const PURCHASE_ORDER_REPO = Symbol('PURCHASE_ORDER_REPO');
export const TENANT_SCHEMA = Symbol('TENANT_SCHEMA');
