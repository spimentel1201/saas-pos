import { Inject, Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../../../../shared/infrastructure/prisma/tenant-prisma.service.js';
import type {
  StockRepositoryPort,
  TransferRepositoryPort,
} from '../../application/ports/inventory.repository.port.js';
import {
  Movement,
  type MovementType,
  Stock,
  StockTransfer,
  type TransferItem,
} from '../../domain/entities/stock.entity.js';
import { TENANT_SCHEMA } from '../../inventory.tokens.js';

@Injectable()
export class PrismaStockRepository implements StockRepositoryPort {
  constructor(
    @Inject(TENANT_SCHEMA) private readonly tenantSchema: string,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  async findByBranchProduct(branchCode: string, productId: string): Promise<Stock | null> {
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries on tx client
    return this.tenantPrisma.withTenant(async (tx: any) => {
      const rows = await tx.$queryRawUnsafe(
        'SELECT id, branch_code, product_id, qty, reserved, min_qty, max_qty, avg_cost, version, updated_at FROM inventory_stocks WHERE branch_code = $1 AND product_id = $2',
        branchCode,
        productId,
      );
      return rows.length > 0 ? this.mapToStock(rows[0]) : null;
    });
  }

  async findByBranch(branchCode: string): Promise<Stock[]> {
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries on tx client
    return this.tenantPrisma.withTenant(async (tx: any) => {
      const rows = await tx.$queryRawUnsafe(
        'SELECT id, branch_code, product_id, qty, reserved, min_qty, max_qty, avg_cost, version, updated_at FROM inventory_stocks WHERE branch_code = $1 ORDER BY product_id ASC',
        branchCode,
      );
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL row
      return rows.map((r: any) => this.mapToStock(r));
    });
  }

  async findByProduct(productId: string): Promise<Stock[]> {
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries on tx client
    return this.tenantPrisma.withTenant(async (tx: any) => {
      const rows = await tx.$queryRawUnsafe(
        'SELECT id, branch_code, product_id, qty, reserved, min_qty, max_qty, avg_cost, version, updated_at FROM inventory_stocks WHERE product_id = $1 ORDER BY branch_code ASC',
        productId,
      );
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL row
      return rows.map((r: any) => this.mapToStock(r));
    });
  }

  async findLowStock(branchCode?: string): Promise<Stock[]> {
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries on tx client
    return this.tenantPrisma.withTenant(async (tx: any) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL rows
      const rows: any[] = branchCode
        ? await tx.$queryRawUnsafe(
            'SELECT id, branch_code, product_id, qty, reserved, min_qty, max_qty, avg_cost, version, updated_at FROM inventory_stocks WHERE branch_code = $1 AND qty <= min_qty ORDER BY product_id ASC',
            branchCode,
          )
        : await tx.$queryRawUnsafe(
            'SELECT id, branch_code, product_id, qty, reserved, min_qty, max_qty, avg_cost, version, updated_at FROM inventory_stocks WHERE qty <= min_qty ORDER BY branch_code, product_id ASC',
          );
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL row
      return rows.map((r: any) => this.mapToStock(r));
    });
  }

  async upsert(stock: Stock): Promise<Stock> {
    const dto = stock.toDTO();
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries on tx client
    return this.tenantPrisma.withTenant(async (tx: any) => {
      if (dto.id > 0) {
        await tx.$executeRawUnsafe(
          `UPDATE inventory_stocks SET qty = $1, reserved = $2, min_qty = $3, max_qty = $4,
           avg_cost = $5, version = $6, updated_at = NOW()
           WHERE id = $7 AND version = $8`,
          dto.qty,
          dto.reserved,
          dto.minQty,
          dto.maxQty,
          dto.avgCost,
          dto.version,
          dto.id,
          dto.version - 1,
        );
      } else {
        // biome-ignore lint/suspicious/noExplicitAny: raw SQL rows
        const inserted: any[] = await tx.$queryRawUnsafe(
          `INSERT INTO inventory_stocks (branch_code, product_id, qty, reserved, min_qty, max_qty, avg_cost, version, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
           ON CONFLICT (branch_code, product_id) DO UPDATE
             SET qty = EXCLUDED.qty, reserved = EXCLUDED.reserved, min_qty = EXCLUDED.min_qty,
                 max_qty = EXCLUDED.max_qty, avg_cost = EXCLUDED.avg_cost, version = inventory_stocks.version + 1,
                 updated_at = NOW()
           RETURNING id`,
          dto.branchCode,
          dto.productId,
          dto.qty,
          dto.reserved,
          dto.minQty,
          dto.maxQty,
          dto.avgCost,
          dto.version,
        );
        if (inserted.length > 0) {
          return Stock.rehydrate({ ...dto, id: Number(inserted[0].id) });
        }
      }
      return stock;
    });
  }

  async listMovements(stockId: number, limit = 100): Promise<Movement[]> {
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries on tx client
    return this.tenantPrisma.withTenant(async (tx: any) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL rows
      const rows: any[] = await tx.$queryRawUnsafe(
        'SELECT id, stock_id, type, delta, reason, ref, branch_code, user_id, created_at FROM inventory_movements WHERE stock_id = $1 ORDER BY created_at DESC LIMIT $2',
        stockId,
        limit,
      );
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL row
      return rows.map((r: any) => this.mapToMovement(r));
    });
  }

  async addMovement(input: {
    stockId: number;
    type: MovementType;
    delta: number;
    reason?: string;
    ref?: string;
    branchCode: string;
    userId: string;
  }): Promise<Movement> {
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries on tx client
    return this.tenantPrisma.withTenant(async (tx: any) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL rows
      const rows: any[] = await tx.$queryRawUnsafe(
        `INSERT INTO inventory_movements (stock_id, type, delta, reason, ref, branch_code, user_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id, stock_id, type, delta, reason, ref, branch_code, user_id, created_at`,
        input.stockId,
        input.type,
        input.delta,
        input.reason ?? null,
        input.ref ?? null,
        input.branchCode,
        input.userId,
      );
      return this.mapToMovement(rows[0]);
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw SQL row mapping
  private mapToStock(row: any): Stock {
    return Stock.rehydrate({
      id: Number(row.id),
      branchCode: row.branch_code,
      productId: row.product_id,
      qty: Number(row.qty),
      reserved: Number(row.reserved),
      minQty: Number(row.min_qty),
      maxQty: Number(row.max_qty),
      avgCost: Number(row.avg_cost),
      version: row.version,
      updatedAt: new Date(row.updated_at),
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw SQL row mapping
  private mapToMovement(row: any): Movement {
    return Movement.rehydrate({
      id: Number(row.id),
      stockId: Number(row.stock_id),
      type: row.type,
      delta: Number(row.delta),
      reason: row.reason ?? undefined,
      ref: row.ref ?? undefined,
      branchCode: row.branch_code,
      userId: row.user_id,
      createdAt: new Date(row.created_at),
    });
  }
}

@Injectable()
export class PrismaTransferRepository implements TransferRepositoryPort {
  constructor(
    @Inject(TENANT_SCHEMA) private readonly tenantSchema: string,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  async findById(id: string): Promise<StockTransfer | null> {
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries on tx client
    return this.tenantPrisma.withTenant(async (tx: any) => {
      const rows = await tx.$queryRawUnsafe(
        'SELECT id, from_branch, to_branch, status, items, created_by, created_at, updated_at FROM stock_transfers WHERE id = $1',
        id,
      );
      return rows.length > 0 ? this.mapToTransfer(rows[0]) : null;
    });
  }

  async findAll(status?: string): Promise<StockTransfer[]> {
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries on tx client
    return this.tenantPrisma.withTenant(async (tx: any) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL rows
      const rows: any[] = status
        ? await tx.$queryRawUnsafe(
            'SELECT id, from_branch, to_branch, status, items, created_by, created_at, updated_at FROM stock_transfers WHERE status = $1 ORDER BY created_at DESC',
            status,
          )
        : await tx.$queryRawUnsafe(
            'SELECT id, from_branch, to_branch, status, items, created_by, created_at, updated_at FROM stock_transfers ORDER BY created_at DESC',
          );
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL row
      return rows.map((r: any) => this.mapToTransfer(r));
    });
  }

  async save(transfer: StockTransfer): Promise<StockTransfer> {
    const dto = transfer.toDTO();
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries on tx client
    return this.tenantPrisma.withTenant(async (tx: any) => {
      const existing = (await tx.$queryRawUnsafe(
        'SELECT id FROM stock_transfers WHERE id = $1',
        dto.id,
      )) as { id: string }[];
      if (existing.length > 0) {
        await tx.$executeRawUnsafe(
          'UPDATE stock_transfers SET from_branch = $1, to_branch = $2, status = $3, items = $4, updated_at = NOW() WHERE id = $5',
          dto.fromBranch,
          dto.toBranch,
          dto.status,
          JSON.stringify(dto.items),
          dto.id,
        );
      } else {
        await tx.$executeRawUnsafe(
          `INSERT INTO stock_transfers (id, from_branch, to_branch, status, items, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          dto.id,
          dto.fromBranch,
          dto.toBranch,
          dto.status,
          JSON.stringify(dto.items),
          dto.createdBy,
        );
      }
      return transfer;
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw SQL row mapping
  private mapToTransfer(row: any): StockTransfer {
    const items: TransferItem[] = Array.isArray(row.items)
      ? row.items
      : JSON.parse(row.items ?? '[]');
    return StockTransfer.rehydrate({
      id: row.id,
      fromBranch: row.from_branch,
      toBranch: row.to_branch,
      status: row.status,
      items,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
