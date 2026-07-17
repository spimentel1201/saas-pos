import { Inject, Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../../../../shared/infrastructure/prisma/tenant-prisma.service.js';
import type {
  PurchaseOrderRepositoryPort,
  SupplierRepositoryPort,
} from '../../application/ports/purchasing.repository.port.js';
import {
  PurchaseOrder,
  type PurchaseOrderItem,
  PurchaseReceipt,
  Supplier,
} from '../../domain/entities/purchasing.entity.js';
import { TENANT_SCHEMA } from '../../purchasing.tokens.js';

@Injectable()
export class PrismaSupplierRepository implements SupplierRepositoryPort {
  constructor(
    @Inject(TENANT_SCHEMA) private readonly tenantSchema: string,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  async findById(id: string): Promise<Supplier | null> {
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries on tx client
    return this.tenantPrisma.withTenant(async (tx: any) => {
      const rows = (await tx.$queryRawUnsafe(
        'SELECT id, name, contact, tax_id, email, phone, created_at FROM suppliers WHERE id = $1',
        id,
      )) as {
        id: string;
        name: string;
        contact: string | null;
        tax_id: string | null;
        email: string | null;
        phone: string | null;
        created_at: Date;
      }[];
      return rows.length > 0 ? this.mapToSupplier(rows[0]) : null;
    });
  }

  async findAll(): Promise<Supplier[]> {
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries on tx client
    return this.tenantPrisma.withTenant(async (tx: any) => {
      const rows = (await tx.$queryRawUnsafe(
        'SELECT id, name, contact, tax_id, email, phone, created_at FROM suppliers ORDER BY name ASC',
      )) as {
        id: string;
        name: string;
        contact: string | null;
        tax_id: string | null;
        email: string | null;
        phone: string | null;
        created_at: Date;
      }[];
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL row
      return rows.map((r: any) => this.mapToSupplier(r));
    });
  }

  async save(supplier: Supplier): Promise<Supplier> {
    const dto = supplier.toDTO();
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries on tx client
    return this.tenantPrisma.withTenant(async (tx: any) => {
      const existing = (await tx.$queryRawUnsafe(
        'SELECT id FROM suppliers WHERE id = $1',
        dto.id,
      )) as { id: string }[];
      if (existing.length > 0) {
        await tx.$executeRawUnsafe(
          'UPDATE suppliers SET name = $1, contact = $2, tax_id = $3, email = $4, phone = $5 WHERE id = $6',
          dto.name,
          dto.contact ?? null,
          dto.taxId ?? null,
          dto.email ?? null,
          dto.phone ?? null,
          dto.id,
        );
      } else {
        await tx.$executeRawUnsafe(
          'INSERT INTO suppliers (id, name, contact, tax_id, email, phone, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
          dto.id,
          dto.name,
          dto.contact ?? null,
          dto.taxId ?? null,
          dto.email ?? null,
          dto.phone ?? null,
        );
      }
      return supplier;
    });
  }

  async delete(id: string): Promise<void> {
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries on tx client
    return this.tenantPrisma.withTenant(async (tx: any) => {
      await tx.$executeRawUnsafe('DELETE FROM suppliers WHERE id = $1', id);
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw SQL row mapping
  private mapToSupplier(row: any): Supplier {
    return Supplier.rehydrate({
      id: row.id,
      name: row.name,
      contact: row.contact ?? undefined,
      taxId: row.tax_id ?? undefined,
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      createdAt: new Date(row.created_at),
    });
  }
}

@Injectable()
export class PrismaPurchaseOrderRepository implements PurchaseOrderRepositoryPort {
  constructor(
    @Inject(TENANT_SCHEMA) private readonly tenantSchema: string,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  async findById(id: string): Promise<PurchaseOrder | null> {
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries on tx client
    return this.tenantPrisma.withTenant(async (tx: any) => {
      const rows = (await tx.$queryRawUnsafe(
        'SELECT id, branch_code, supplier_id, status, total, items, created_by, created_at, updated_at FROM purchase_orders WHERE id = $1',
        id,
      )) as {
        id: string;
        branch_code: string;
        supplier_id: string;
        status: string;
        total: number;
        items: string;
        created_by: string;
        created_at: Date;
        updated_at: Date;
      }[];
      return rows.length > 0 ? this.mapToPO(rows[0]) : null;
    });
  }

  async findAll(status?: string): Promise<PurchaseOrder[]> {
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries on tx client
    return this.tenantPrisma.withTenant(async (tx: any) => {
      const rows = status
        ? ((await tx.$queryRawUnsafe(
            'SELECT id, branch_code, supplier_id, status, total, items, created_by, created_at, updated_at FROM purchase_orders WHERE status = $1 ORDER BY created_at DESC',
            status,
          )) as {
            id: string;
            branch_code: string;
            supplier_id: string;
            status: string;
            total: number;
            items: string;
            created_by: string;
            created_at: Date;
            updated_at: Date;
          }[])
        : ((await tx.$queryRawUnsafe(
            'SELECT id, branch_code, supplier_id, status, total, items, created_by, created_at, updated_at FROM purchase_orders ORDER BY created_at DESC',
          )) as {
            id: string;
            branch_code: string;
            supplier_id: string;
            status: string;
            total: number;
            items: string;
            created_by: string;
            created_at: Date;
            updated_at: Date;
          }[]);
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL row
      return rows.map((r: any) => this.mapToPO(r));
    });
  }

  async save(po: PurchaseOrder): Promise<PurchaseOrder> {
    const dto = po.toDTO();
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries on tx client
    return this.tenantPrisma.withTenant(async (tx: any) => {
      const existing = (await tx.$queryRawUnsafe(
        'SELECT id FROM purchase_orders WHERE id = $1',
        dto.id,
      )) as { id: string }[];
      if (existing.length > 0) {
        await tx.$executeRawUnsafe(
          'UPDATE purchase_orders SET branch_code = $1, supplier_id = $2, status = $3, total = $4, items = $5, updated_at = NOW() WHERE id = $6',
          dto.branchCode,
          dto.supplierId,
          dto.status,
          dto.total,
          JSON.stringify(dto.items),
          dto.id,
        );
      } else {
        await tx.$executeRawUnsafe(
          `INSERT INTO purchase_orders (id, branch_code, supplier_id, status, total, items, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          dto.id,
          dto.branchCode,
          dto.supplierId,
          dto.status,
          dto.total,
          JSON.stringify(dto.items),
          dto.createdBy,
        );
      }
      return po;
    });
  }

  async listReceipts(poId: string): Promise<PurchaseReceipt[]> {
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries on tx client
    return this.tenantPrisma.withTenant(async (tx: any) => {
      const rows = (await tx.$queryRawUnsafe(
        'SELECT id, po_id, received_at, received_by, items FROM purchase_receipts WHERE po_id = $1 ORDER BY received_at DESC',
        poId,
      )) as { id: number; po_id: string; received_at: Date; received_by: string; items: string }[];
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL row
      return rows.map((r: any) => this.mapToReceipt(r));
    });
  }

  async addReceipt(input: {
    poId: string;
    receivedBy: string;
    items: PurchaseOrderItem[];
  }): Promise<PurchaseReceipt> {
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries on tx client
    return this.tenantPrisma.withTenant(async (tx: any) => {
      const rows = (await tx.$queryRawUnsafe(
        `INSERT INTO purchase_receipts (po_id, received_at, received_by, items)
         VALUES ($1, NOW(), $2, $3)
         RETURNING id, po_id, received_at, received_by, items`,
        input.poId,
        input.receivedBy,
        JSON.stringify(input.items),
      )) as { id: number; po_id: string; received_at: Date; received_by: string; items: string }[];
      return this.mapToReceipt(rows[0]);
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw SQL row mapping
  private mapToPO(row: any): PurchaseOrder {
    const items: PurchaseOrderItem[] = Array.isArray(row.items)
      ? row.items
      : JSON.parse(row.items ?? '[]');
    return PurchaseOrder.rehydrate({
      id: row.id,
      branchCode: row.branch_code,
      supplierId: row.supplier_id,
      status: row.status,
      total: Number(row.total),
      items,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw SQL row mapping
  private mapToReceipt(row: any): PurchaseReceipt {
    const items: PurchaseOrderItem[] = Array.isArray(row.items)
      ? row.items
      : JSON.parse(row.items ?? '[]');
    return PurchaseReceipt.rehydrate({
      id: Number(row.id),
      poId: row.po_id,
      receivedAt: new Date(row.received_at),
      receivedBy: row.received_by,
      items,
    });
  }
}
