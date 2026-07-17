import { Injectable, Inject } from '@nestjs/common';
import { ulid } from 'ulid';
import { TenantPrismaService } from '../../../../shared/infrastructure/prisma/tenant-prisma.service.js';
import type { SaleRepositoryPort, SaleFilter, PaginatedSales, CheckoutInput, ReturnInput } from '../../application/ports/sale.repository.port.js';
import {
  Sale,
  SaleItem,
  SalePayment,
  SaleReturn,
  type SaleItemProps,
  type SalePaymentProps,
  type PaymentMethod,
} from '../../domain/entities/sale.entity.js';
import { computeSaleTotals } from '../../domain/services/sale-calculator.service.js';
import { SALE_REPO, TENANT_SCHEMA } from '../../sales.tokens.js';

@Injectable()
export class PrismaSaleRepository implements SaleRepositoryPort {
  constructor(
    @Inject(TENANT_SCHEMA) private readonly tenantSchema: string,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  async nextNumberSeq(branchCode: string, date: Date): Promise<number> {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    return this.tenantPrisma.withTenant(async (tx) => {
      const rows = await tx.$queryRawUnsafe(
        `SELECT COUNT(*) as cnt FROM sales
         WHERE branch_code = $1 AND created_at >= $2 AND created_at < $3`,
        branchCode, dayStart, dayEnd,
      ) as { cnt: bigint }[];
      return Number(rows[0]?.cnt ?? 0) + 1;
    });
  }

  async findTodaysCount(branchCode: string, date: Date): Promise<number> {
    return this.nextNumberSeq(branchCode, date);
  }

  async checkout(input: CheckoutInput): Promise<Sale> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // 1. Insertar venta
      await tx.$executeRawUnsafe(
        `INSERT INTO sales (id, branch_code, user_id, cashier_session_id, number_seq,
           customer_id, subtotal, tax, discount, total, status, meta, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
        input.saleId, input.branchCode, input.userId, input.cashierSessionId ?? null,
        input.totals.numberSeq, input.customerId ?? null,
        input.totals.subtotal, input.totals.tax, input.totals.discount, input.totals.total,
        'COMPLETED', JSON.stringify(input.meta ?? {}),
      );

      // 2. Insertar items + restar stock + registrar movimiento inventory
      for (const item of input.items) {
        await tx.$executeRawUnsafe(
          `INSERT INTO sale_items (sale_id, product_id, variant_id, qty, unit_price, tax_amount, discount, total)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          input.saleId, item.productId, item.variantId ?? null,
          item.qty, item.unitPrice, item.taxAmount, item.discount, item.total,
        );

        // Restar stock
        await tx.$executeRawUnsafe(
          `INSERT INTO inventory_stocks (branch_code, product_id, qty, reserved, min_qty, max_qty, avg_cost, version, updated_at)
           VALUES ($1, $2, 0, 0, 0, 0, 0, 1, NOW())
           ON CONFLICT (branch_code, product_id) DO UPDATE
             SET qty = inventory_stocks.qty - $3,
                 version = inventory_stocks.version + 1,
                 updated_at = NOW()
           WHERE inventory_stocks.branch_code = $1 AND inventory_stocks.product_id = $2`,
          input.branchCode, item.productId, item.qty,
        );

        // Obtener stock_id para movimiento
        const stockRows = await tx.$queryRawUnsafe(
          `SELECT id FROM inventory_stocks WHERE branch_code = $1 AND product_id = $2`,
          input.branchCode, item.productId,
        ) as { id: number }[];
        if (stockRows.length > 0 && stockRows[0]) {
          const stockId = stockRows[0].id;
          await tx.$executeRawUnsafe(
            `INSERT INTO inventory_movements (stock_id, type, delta, reason, ref, branch_code, user_id, created_at)
             VALUES ($1, 'SALE', $2, 'Venta', $3, $4, $5, NOW())`,
            stockId, -item.qty, input.saleId, input.branchCode, input.userId,
          );
        }
      }

      // 3. Insertar pagos + cash_movements si efectivo
      for (const payment of input.payments) {
        await tx.$executeRawUnsafe(
          `INSERT INTO sale_payments (sale_id, method, amount, ref)
           VALUES ($1, $2, $3, $4)`,
          input.saleId, payment.method, payment.amount, payment.ref ?? null,
        );

        if (payment.method === 'CASH' || payment.method === 'MIXED') {
          const cashAmount = payment.method === 'CASH' ? payment.amount : 0;
          if (cashAmount > 0) {
            await tx.$executeRawUnsafe(
              `INSERT INTO cash_movements (session_id, type, amount, reason, created_at)
               SELECT id, 'SALE', $1, $2, NOW()
               FROM cash_sessions
               WHERE branch_code = $1 AND status = 'OPEN'
               ORDER BY opened_at DESC
               LIMIT 1`,
              cashAmount, `Venta ${input.saleId}`,
            );
          }
        }
      }

      // 4. Reconstruir entidad
      return this.mapToSale(input);
    });
  }

  private mapToSale(input: CheckoutInput): Sale {
    const items = input.items.map((i: SaleItem) => SaleItem.rehydrate({
      productId: i.productId,
      variantId: i.variantId,
      qty: i.qty,
      unitPrice: i.unitPrice,
      taxAmount: i.taxAmount,
      discount: i.discount,
      total: i.total,
    }));

    const payments = input.payments.map((p: { method: PaymentMethod; amount: number; ref?: string }) => SalePayment.rehydrate({
      method: p.method,
      amount: p.amount,
      ref: p.ref,
    }));

    return Sale.rehydrate({
      id: input.saleId,
      branchCode: input.branchCode,
      userId: input.userId,
      cashierSessionId: input.cashierSessionId,
      numberSeq: input.totals.numberSeq,
      customerId: input.customerId,
      subtotal: input.totals.subtotal,
      tax: input.totals.tax,
      discount: input.totals.discount,
      total: input.totals.total,
      status: 'COMPLETED',
      meta: input.meta ?? {},
      items,
      payments,
      createdAt: new Date(),
    });
  }

  async findById(id: string): Promise<Sale | null> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const rows = await tx.$queryRawUnsafe(
        `SELECT s.id, s.branch_code, s.user_id, s.cashier_session_id, s.number_seq,
                s.customer_id, s.subtotal, s.tax, s.discount, s.total, s.status, s.meta, s.created_at
         FROM sales s WHERE s.id = $1`,
        id,
      ) as any[];
      if (rows.length === 0) return null;

      const sale = rows[0];
      const items = await this.fetchItems(tx, id);
      const payments = await this.fetchPayments(tx, id);
      return this.hydrateSale(sale, items, payments);
    });
  }

  private async fetchItems(tx: any, saleId: string): Promise<any[]> {
    return tx.$queryRawUnsafe(
      `SELECT product_id, variant_id, qty, unit_price, tax_amount, discount, total
       FROM sale_items WHERE sale_id = $1`,
      saleId,
    ) as any[];
  }

  private async fetchPayments(tx: any, saleId: string): Promise<any[]> {
    return tx.$queryRawUnsafe(
      `SELECT method, amount, ref FROM sale_payments WHERE sale_id = $1`,
      saleId,
    ) as any[];
  }

  private hydrateSale(sale: any, items: any[], payments: any[]): Sale {
    const itemEntities = items.map(i => SaleItem.rehydrate({
      productId: i.product_id,
      variantId: i.variant_id ?? undefined,
      qty: Number(i.qty),
      unitPrice: Number(i.unit_price),
      taxAmount: Number(i.tax_amount),
      discount: Number(i.discount),
      total: Number(i.total),
    }));

    const paymentEntities = payments.map(p => SalePayment.rehydrate({
      method: p.method,
      amount: Number(p.amount),
      ref: p.ref ?? undefined,
    }));

    return Sale.rehydrate({
      id: sale.id,
      branchCode: sale.branch_code,
      userId: sale.user_id,
      cashierSessionId: sale.cashier_session_id,
      numberSeq: sale.number_seq,
      customerId: sale.customer_id ?? undefined,
      subtotal: Number(sale.subtotal),
      tax: Number(sale.tax),
      discount: Number(sale.discount),
      total: Number(sale.total),
      status: sale.status,
      meta: typeof sale.meta === 'string' ? JSON.parse(sale.meta) : (sale.meta ?? {}),
      items: itemEntities,
      payments: paymentEntities,
      createdAt: new Date(sale.created_at),
    });
  }

  async findAll(filter: SaleFilter): Promise<PaginatedSales> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const offset = (page - 1) * limit;

    return this.tenantPrisma.withTenant(async (tx) => {
      const conditions: string[] = ['1=1'];
      const params: any[] = [];
      let idx = 1;

      if (filter.branchCode) { conditions.push(`branch_code = $${idx++}`); params.push(filter.branchCode); }
      if (filter.userId) { conditions.push(`user_id = $${idx++}`); params.push(filter.userId); }
      if (filter.customerId) { conditions.push(`customer_id = $${idx++}`); params.push(filter.customerId); }
      if (filter.status) { conditions.push(`status = $${idx++}`); params.push(filter.status); }
      if (filter.from) { conditions.push(`created_at >= $${idx++}`); params.push(filter.from); }
      if (filter.to) { conditions.push(`created_at <= $${idx++}`); params.push(filter.to); }

      const where = conditions.join(' AND ');
      const sortMap: Record<string, string> = { createdAt: 'created_at', total: 'total' };
      const sortBy = sortMap[filter.sortBy ?? 'createdAt'] ?? 'created_at';
      const sortOrder = filter.sortOrder ?? 'desc';

      const countRows = await tx.$queryRawUnsafe(
        `SELECT COUNT(*) as cnt FROM sales WHERE ${where}`,
        ...params,
      ) as { cnt: bigint }[];
      const total = Number(countRows[0]?.cnt ?? 0);

      const rows = await tx.$queryRawUnsafe(
        `SELECT id, branch_code, user_id, cashier_session_id, number_seq,
                customer_id, subtotal, tax, discount, total, status, meta, created_at
         FROM sales WHERE ${where}
         ORDER BY ${sortBy} ${sortOrder}
         LIMIT $${idx++} OFFSET $${idx}`,
        ...params, limit, offset,
      ) as any[];

      const data = await Promise.all(
        rows.map(async (r) => {
          const items = await this.fetchItems(tx, r.id);
          const payments = await this.fetchPayments(tx, r.id);
          return this.hydrateSale(r, items, payments);
        })
      );

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    });
  }

  async registerReturn(input: ReturnInput): Promise<SaleReturn> {
    return this.tenantPrisma.withTenant(async (tx) => {
      await tx.$executeRawUnsafe(
        `INSERT INTO returns (id, sale_id, reason, items, total, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        input.returnId, input.saleId, input.reason ?? null, JSON.stringify(input.items.map((i: SaleItem) => i.toDTO())), input.total,
      );

      // Actualizar estado venta status de la venta
      await tx.$executeRawUnsafe(
        `UPDATE sales SET status = 'RETURNED' WHERE id = $1`,
        input.saleId,
      );

      // Sumar stock devuelto + movimientos
      for (const item of input.items) {
        await tx.$executeRawUnsafe(
          `INSERT INTO inventory_stocks (branch_code, product_id, qty, reserved, min_qty, max_qty, avg_cost, version, updated_at)
           VALUES ($1, $2, 0, 0, 0, 0, 0, 1, NOW())
           ON CONFLICT (branch_code, product_id) DO UPDATE
             SET qty = inventory_stocks.qty + $3,
                 version = inventory_stocks.version + 1,
                 updated_at = NOW()
           WHERE inventory_stocks.branch_code = $1 AND inventory_stocks.product_id = $2`,
          // Obtener branchCode de la venta original
          (await this.getSaleBranch(tx, input.saleId)) ?? '', item.productId, item.qty,
        );

        const stockRows = await tx.$queryRawUnsafe(
          `SELECT id FROM inventory_stocks WHERE branch_code = $1 AND product_id = $2`,
          (await this.getSaleBranch(tx, input.saleId)) ?? '', item.productId,
        ) as { id: number }[];
        if (stockRows.length > 0 && stockRows[0]) {
          await tx.$executeRawUnsafe(
            `INSERT INTO inventory_movements (stock_id, type, delta, reason, ref, branch_code, user_id, created_at)
             VALUES ($1, 'RETURN', $2, $3, $4, $5, $6, NOW())`,
            stockRows[0].id, item.qty, `Devolución ${input.returnId}`, input.returnId,
            (await this.getSaleBranch(tx, input.saleId)) ?? '', 'system',
          );
        }
      }

      return SaleReturn.rehydrate({
        id: input.returnId,
        saleId: input.saleId,
        reason: input.reason,
        items: input.items,
        total: input.total,
        createdAt: new Date(),
      });
    });
  }

  private async getSaleBranch(tx: any, saleId: string): Promise<string | null> {
    const rows = await tx.$queryRawUnsafe(
      'SELECT branch_code FROM sales WHERE id = $1',
      saleId,
    ) as { branch_code: string }[];
    return rows[0]?.branch_code ?? null;
  }

  async listReturns(saleId: string): Promise<SaleReturn[]> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const rows = await tx.$queryRawUnsafe(
        `SELECT id, sale_id, reason, items, total, created_at FROM returns WHERE sale_id = $1 ORDER BY created_at DESC`,
        saleId,
      ) as any[];
      return rows.map(r => this.hydrateReturn(r));
    });
  }

  private hydrateReturn(row: any): SaleReturn {
    const items: any[] = Array.isArray(row.items) ? row.items : JSON.parse(row.items ?? '[]');
    const itemEntities = items.map((i: any) => SaleItem.rehydrate({
      productId: i.productId,
      variantId: i.variantId,
      qty: i.qty,
      unitPrice: i.unitPrice,
      taxAmount: i.taxAmount,
      discount: i.discount,
      total: i.total,
    }));
    return SaleReturn.rehydrate({
      id: row.id,
      saleId: row.sale_id,
      reason: row.reason ?? undefined,
      items: itemEntities,
      total: Number(row.total),
      createdAt: new Date(row.created_at),
    });
  }

  async voidSale(id: string): Promise<void> {
    return this.tenantPrisma.withTenant(async (tx) => {
      await tx.$executeRawUnsafe('UPDATE sales SET status = $1 WHERE id = $2', 'VOID', id);
    });
  }
}