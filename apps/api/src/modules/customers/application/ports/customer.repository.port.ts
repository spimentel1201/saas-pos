import type {
  Customer,
  CustomerDTO,
  CustomerType,
  DocumentType,
} from '../../domain/entities/customer.entity.js';

export interface CustomerFilter {
  search?: string;
  type?: CustomerType;
  active?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'creditBalance';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedCustomers {
  data: CustomerDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerRepositoryPort {
  findById(id: string): Promise<Customer | null>;
  findByDocument(documentType: DocumentType, documentNumber: string): Promise<Customer | null>;
  findAll(filter: CustomerFilter): Promise<PaginatedCustomers>;
  save(customer: Customer): Promise<Customer>;
  delete(id: string): Promise<void>;
  searchPos(query: string, limit?: number): Promise<CustomerDTO[]>;
  getPurchaseHistory(
    customerId: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedPurchaseHistory>;
}

export interface PurchaseHistoryItem {
  saleId: string;
  createdAt: Date;
  total: number;
  items: { productName: string; qty: number; unitPrice: number; total: number }[];
}

export interface PaginatedPurchaseHistory {
  data: PurchaseHistoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
