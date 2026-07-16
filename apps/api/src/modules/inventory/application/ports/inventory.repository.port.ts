import type {
  Movement,
  MovementType,
  Stock,
  StockTransfer,
} from '../../domain/entities/stock.entity.js';

export interface StockRepositoryPort {
  findByBranchProduct(branchCode: string, productId: string): Promise<Stock | null>;
  findByBranch(branchCode: string): Promise<Stock[]>;
  findByProduct(productId: string): Promise<Stock[]>;
  findLowStock(branchCode?: string): Promise<Stock[]>;
  upsert(stock: Stock): Promise<Stock>;
  listMovements(stockId: number, limit?: number): Promise<Movement[]>;
  addMovement(input: {
    stockId: number;
    type: MovementType;
    delta: number;
    reason?: string;
    ref?: string;
    branchCode: string;
    userId: string;
  }): Promise<Movement>;
}

export interface TransferRepositoryPort {
  findById(id: string): Promise<StockTransfer | null>;
  findAll(status?: string): Promise<StockTransfer[]>;
  save(transfer: StockTransfer): Promise<StockTransfer>;
}

export const STOCK_REPO = Symbol('STOCK_REPO');
export const TRANSFER_REPO = Symbol('TRANSFER_REPO');
