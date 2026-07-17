import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../../../../shared/infrastructure/prisma/tenant-prisma.service.js';
import type {
  CustomerFilter,
  CustomerRepositoryPort,
  PaginatedCustomers,
  PaginatedPurchaseHistory,
} from '../../application/ports/customer.repository.port.js';
import {
  Customer,
  type CustomerDTO,
  type CustomerType,
  type DocumentType,
} from '../../domain/entities/customer.entity.js';

@Injectable()
export class PrismaCustomerRepository implements CustomerRepositoryPort {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async findById(id: string): Promise<Customer | null> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, name, email, phone, type, document_type, document_number,
                address, city, state, zip_code, tax_id, credit_balance, notes,
                active, created_by, created_at, updated_at
         FROM customers WHERE id = $1`,
        id,
      );
      return rows.length > 0 ? this.mapToCustomer(rows[0]) : null;
    });
  }

  async findByDocument(
    documentType: DocumentType,
    documentNumber: string,
  ): Promise<Customer | null> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, name, email, phone, type, document_type, document_number,
                address, city, state, zip_code, tax_id, credit_balance, notes,
                active, created_by, created_at, updated_at
         FROM customers WHERE document_type = $1 AND document_number = $2`,
        documentType,
        documentNumber,
      );
      return rows.length > 0 ? this.mapToCustomer(rows[0]) : null;
    });
  }

  async findAll(filter: CustomerFilter): Promise<PaginatedCustomers> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const conditions: string[] = ['active = true'];
      // biome-ignore lint/suspicious/noExplicitAny: dynamic params for raw SQL
      const params: any[] = [];
      let idx = 1;

      if (filter.search) {
        conditions.push(`(
          name ILIKE $${idx} OR
          phone ILIKE $${idx} OR
          email ILIKE $${idx} OR
          document_number ILIKE $${idx}
        )`);
        params.push(`%${filter.search}%`);
        idx++;
      }
      if (filter.type) {
        conditions.push(`type = $${idx++}`);
        params.push(filter.type);
      }
      if (filter.active !== undefined) {
        conditions.push(`active = $${idx++}`);
        params.push(filter.active);
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const sortColumn =
        filter.sortBy === 'creditBalance'
          ? 'credit_balance'
          : filter.sortBy === 'createdAt'
            ? 'created_at'
            : 'name';
      const sortDir = filter.sortOrder === 'desc' ? 'DESC' : 'ASC';
      const page = filter.page ?? 1;
      const limit = filter.limit ?? 20;
      const offset = (page - 1) * limit;

      const countResult = await tx.$queryRawUnsafe<{ count: number }[]>(
        `SELECT count(*) as count FROM customers ${where}`,
        ...params,
      );
      const total = Number(countResult[0]?.count ?? 0);

      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, name, email, phone, type, document_type, document_number,
                address, city, state, zip_code, tax_id, credit_balance, notes,
                active, created_by, created_at, updated_at
         FROM customers ${where}
         ORDER BY ${sortColumn} ${sortDir}
         LIMIT $${idx++} OFFSET $${idx++}`,
        ...params,
        limit,
        offset,
      );

      return {
        data: rows.map((r) => this.mapToCustomer(r).toDTO()),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    });
  }

  async save(customer: Customer): Promise<Customer> {
    const dto = customer.toDTO();
    return this.tenantPrisma.withTenant(async (tx) => {
      if (dto.id) {
        await tx.$executeRawUnsafe(
          `UPDATE customers SET name = $1, email = $2, phone = $3, type = $4,
           document_type = $5, document_number = $6, address = $7, city = $8,
           state = $9, zip_code = $10, tax_id = $11, credit_balance = $12,
           notes = $13, active = $14, updated_at = now()
           WHERE id = $15`,
          dto.name,
          dto.email ?? null,
          dto.phone ?? null,
          dto.type,
          dto.documentType ?? null,
          dto.documentNumber ?? null,
          dto.address ?? null,
          dto.city ?? null,
          dto.state ?? null,
          dto.zipCode ?? null,
          dto.taxId ?? null,
          dto.creditBalance,
          dto.notes ?? null,
          dto.active,
          dto.id,
        );
        return customer;
      }
      const inserted = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO customers (name, email, phone, type, document_type, document_number,
         address, city, state, zip_code, tax_id, credit_balance, notes, active, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING id`,
        dto.name,
        dto.email ?? null,
        dto.phone ?? null,
        dto.type,
        dto.documentType ?? null,
        dto.documentNumber ?? null,
        dto.address ?? null,
        dto.city ?? null,
        dto.state ?? null,
        dto.zipCode ?? null,
        dto.taxId ?? null,
        dto.creditBalance,
        dto.notes ?? null,
        dto.active,
        dto.createdBy ?? null,
      );
      if (inserted.length > 0 && inserted[0]) {
        return Customer.rehydrate({ ...dto, id: inserted[0].id });
      }
      return customer;
    });
  }

  async delete(id: string): Promise<void> {
    await this.tenantPrisma.withTenant(async (tx) => {
      await tx.$executeRawUnsafe('DELETE FROM customers WHERE id = $1', id);
    });
  }

  async searchPos(query: string, limit = 10): Promise<CustomerDTO[]> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, name, email, phone, type, document_type, document_number,
                address, city, state, zip_code, tax_id, credit_balance, notes,
                active, created_by, created_at, updated_at
         FROM customers
         WHERE active = true AND (
           phone ILIKE $1 OR
           name ILIKE $1 OR
           email ILIKE $1 OR
           document_number ILIKE $1
         )
         ORDER BY
           CASE WHEN phone = $2 THEN 0
                WHEN phone ILIKE $3 THEN 1
                WHEN document_number = $2 THEN 2
                WHEN document_number ILIKE $3 THEN 3
                ELSE 4
           END,
           name ASC
         LIMIT $4`,
        `%${query}%`,
        query,
        `${query}%`,
        limit,
      );
      return rows.map((r) => this.mapToCustomer(r).toDTO());
    });
  }

  async getPurchaseHistory(
    customerId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedPurchaseHistory> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const countResult = await tx.$queryRawUnsafe<{ count: number }[]>(
        'SELECT count(*) as count FROM sales WHERE customer_id = $1',
        customerId,
      );
      const total = Number(countResult[0]?.count ?? 0);
      const offset = (page - 1) * limit;

      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const salesRows = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, created_at, total, status
         FROM sales WHERE customer_id = $1
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        customerId,
        limit,
        offset,
      );

      const data = [];
      for (const sale of salesRows) {
        // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
        const items = await tx.$queryRawUnsafe<any[]>(
          `SELECT si.product_id, p.name as product_name, si.qty, si.unit_price, si.total
           FROM sale_items si
           JOIN products p ON p.id = si.product_id
           WHERE si.sale_id = $1`,
          sale.id,
        );
        data.push({
          saleId: sale.id,
          createdAt: new Date(sale.created_at),
          total: Number(sale.total),
          items: items.map((i) => ({
            productName: i.product_name,
            qty: Number(i.qty),
            unitPrice: Number(i.unit_price),
            total: Number(i.total),
          })),
        });
      }

      return {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw SQL row mapping
  private mapToCustomer(row: any): Customer {
    return Customer.rehydrate({
      id: row.id,
      name: row.name,
      email: row.email ?? undefined,
      phone: row.phone ?? undefined,
      type: row.type as CustomerType,
      documentType: row.document_type as DocumentType | undefined,
      documentNumber: row.document_number ?? undefined,
      address: row.address ?? undefined,
      city: row.city ?? undefined,
      state: row.state ?? undefined,
      zipCode: row.zip_code ?? undefined,
      taxId: row.tax_id ?? undefined,
      creditBalance: Number(row.credit_balance),
      notes: row.notes ?? undefined,
      active: row.active,
      createdBy: row.created_by ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
