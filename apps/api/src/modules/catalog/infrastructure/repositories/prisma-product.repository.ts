import { Inject, Injectable } from '@nestjs/common';
import { TenantContext } from '../../../../shared/infrastructure/multi-tenant/tenant-context.js';
import { TenantPrismaService } from '../../../../shared/infrastructure/prisma/tenant-prisma.service.js';
import {
  PaginatedResult,
  ProductFilter,
  ProductRepositoryPort,
} from '../../application/ports/catalog.repository.port.js';
import { TENANT_SCHEMA } from '../../catalog.tokens.js';
import { Product } from '../../domain/entities/product.entity.js';
import { ProductId } from '../../domain/entities/product.entity.js';

@Injectable()
export class PrismaProductRepository implements ProductRepositoryPort {
  constructor(
    @Inject(TENANT_SCHEMA) private readonly tenantSchema: string,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  async save(product: Product): Promise<Product> {
    const dto = product.toDTO();
    return this.tenantPrisma.withTenant(async (tx) => {
      const existing = await tx.$queryRawUnsafe<{ id: string }[]>(
        'SELECT id FROM products WHERE id = $1',
        dto.id,
      );
      if (existing.length > 0) {
        await tx.$executeRawUnsafe(
          `UPDATE products SET name = $1, description = $2, sku = $3, barcode = $4, category_id = $5,
           price = $6, cost = $7, type = $8, track_stock = $9, is_active = $10,
           image_public_id = $11, image_url = $12, updated_at = NOW()
           WHERE id = $13`,
          dto.name,
          dto.description ?? null,
          dto.sku,
          dto.barcode ?? null,
          dto.categoryId ?? null,
          dto.price,
          dto.cost,
          dto.type,
          dto.trackStock,
          dto.status === 'ACTIVE',
          null,
          null,
          dto.id,
        );
      } else {
        await tx.$executeRawUnsafe(
          `INSERT INTO products (id, sku, barcode, name, description, category_id,
           cost, price, type, track_stock, is_active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())`,
          dto.id,
          dto.sku,
          dto.barcode ?? null,
          dto.name,
          dto.description ?? null,
          dto.categoryId ?? null,
          dto.cost,
          dto.price,
          dto.type,
          dto.trackStock,
          dto.status === 'ACTIVE',
        );
      }
      return product;
    });
  }

  async findById(id: string): Promise<Product | null> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, sku, barcode, name, description, category_id, cost, price, type,
         track_stock, is_active, image_public_id, image_url, created_at, updated_at
         FROM products WHERE id = $1`,
        id,
      );
      return rows.length > 0 ? this.mapToDomain(rows[0]) : null;
    });
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, sku, barcode, name, description, category_id, cost, price, type,
         track_stock, is_active, image_public_id, image_url, created_at, updated_at
         FROM products WHERE sku = $1`,
        sku,
      );
      return rows.length > 0 ? this.mapToDomain(rows[0]) : null;
    });
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, sku, barcode, name, description, category_id, cost, price, type,
         track_stock, is_active, image_public_id, image_url, created_at, updated_at
         FROM products WHERE barcode = $1`,
        barcode,
      );
      return rows.length > 0 ? this.mapToDomain(rows[0]) : null;
    });
  }

  async findByIds(ids: string[]): Promise<Product[]> {
    return this.tenantPrisma.withTenant(async (tx) => {
      if (ids.length === 0) return [];
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, sku, barcode, name, description, category_id, cost, price, type,
         track_stock, is_active, image_public_id, image_url, created_at, updated_at
         FROM products WHERE id IN (${placeholders})`,
        ...ids,
      );
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      return rows.map((r: any) => this.mapToDomain(r));
    });
  }

  async findAll(filter: ProductFilter): Promise<PaginatedResult<Product>> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const conditions: string[] = [];
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      const params: any[] = [];
      let paramIdx = 1;

      if (filter.search) {
        conditions.push(
          `(name ILIKE $${paramIdx} OR sku ILIKE $${paramIdx} OR barcode ILIKE $${paramIdx} OR description ILIKE $${paramIdx})`,
        );
        params.push(`%${filter.search}%`);
        paramIdx++;
      }
      if (filter.categoryId) {
        conditions.push(`category_id = $${paramIdx}`);
        params.push(filter.categoryId);
        paramIdx++;
      }
      if (filter.minPrice !== undefined) {
        conditions.push(`price >= $${paramIdx}`);
        params.push(filter.minPrice);
        paramIdx++;
      }
      if (filter.maxPrice !== undefined) {
        conditions.push(`price <= $${paramIdx}`);
        params.push(filter.maxPrice);
        paramIdx++;
      }
      if (filter.lowStock) {
        conditions.push('track_stock = true');
        // low stock: no stock concept in current schema, skip condition
      }
      if (filter.hasStock) {
        conditions.push('track_stock = true');
      }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const page = filter.page ?? 1;
      const limit = filter.limit ?? 20;
      const offset = (page - 1) * limit;
      const sortBy = filter.sortBy ?? 'name';
      const sortOrder = filter.sortOrder ?? 'asc';

      const countResult = await tx.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*) as count FROM products ${where}`,
        ...params,
      );
      const total = Number(countResult[0]?.count ?? 0);

      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, sku, barcode, name, description, category_id, cost, price, type,
         track_stock, is_active, image_public_id, image_url, created_at, updated_at
         FROM products ${where} ORDER BY "${sortBy}" ${sortOrder} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
        ...params,
        limit,
        offset,
      );

      return {
        // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
        data: rows.map((r: any) => this.mapToDomain(r)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    });
  }

  async findByCategory(
    categoryId: string,
    filter?: Omit<ProductFilter, 'categoryId'>,
  ): Promise<PaginatedResult<Product>> {
    return this.findAll({ ...filter, categoryId });
  }

  async findLowStock(_tenantId: string): Promise<Product[]> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, sku, barcode, name, description, category_id, cost, price, type,
         track_stock, is_active, image_public_id, image_url, created_at, updated_at
         FROM products WHERE track_stock = true`,
      );
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      return rows.map((r: any) => this.mapToDomain(r));
    });
  }

  async delete(id: string): Promise<void> {
    return this.tenantPrisma.withTenant(async (tx) => {
      await tx.$executeRawUnsafe('DELETE FROM products WHERE id = $1', id);
    });
  }

  async existsBySku(sku: string, excludeId?: string): Promise<boolean> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const rows = await tx.$queryRawUnsafe<{ id: string }[]>(
        excludeId
          ? 'SELECT id FROM products WHERE sku = $1 AND id != $2'
          : 'SELECT id FROM products WHERE sku = $1',
        excludeId ? [sku, excludeId] : [sku],
      );
      return rows.length > 0;
    });
  }

  async existsByBarcode(barcode: string, excludeId?: string): Promise<boolean> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const rows = await tx.$queryRawUnsafe<{ id: string }[]>(
        excludeId
          ? 'SELECT id FROM products WHERE barcode = $1 AND id != $2'
          : 'SELECT id FROM products WHERE barcode = $1',
        excludeId ? [barcode, excludeId] : [barcode],
      );
      return rows.length > 0;
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
  private mapToDomain(row: any): Product {
    const tenantId = row.tenant_id || TenantContext.current?.id || this.tenantSchema || 'unknown';
    return Product.rehydrate({
      id: ProductId.fromString(row.id),
      tenantId: tenantId,
      categoryId: row.category_id,
      name: row.name,
      description: row.description,
      sku: row.sku,
      barcode: row.barcode,
      type: row.type ?? 'GOOD',
      status: row.is_active ? 'ACTIVE' : 'INACTIVE',
      price: Number(row.price),
      cost: Number(row.cost),
      taxRate: 0,
      trackStock: row.track_stock,
      stock: 0,
      minStock: 0,
      maxStock: undefined,
      variants: [],
      images: row.image_url
        ? [{ publicId: row.image_public_id ?? '', url: row.image_url, isPrimary: true }]
        : [],
      tags: [],
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: 'system',
    });
  }
}
