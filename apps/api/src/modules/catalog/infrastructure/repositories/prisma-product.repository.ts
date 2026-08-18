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
        const primaryImage = dto.images[0];
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
          primaryImage?.publicId ?? null,
          primaryImage?.url ?? null,
          dto.id,
        );
      } else {
        const primaryImage = dto.images[0];
        await tx.$executeRawUnsafe(
          `INSERT INTO products (id, sku, barcode, name, description, category_id,
           cost, price, type, track_stock, is_active, image_public_id, image_url, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())`,
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
          primaryImage?.publicId ?? null,
          primaryImage?.url ?? null,
        );

        if (dto.trackStock && dto.stock > 0) {
          const branches = await tx.$queryRawUnsafe<{ code: string }[]>(
            'SELECT code FROM branches WHERE active = true',
          );
          for (const branch of branches) {
            await tx.$executeRawUnsafe(
              `INSERT INTO inventory_stocks (branch_code, product_id, qty, reserved, min_qty, max_qty, avg_cost, version, updated_at)
               VALUES ($1, $2, $3, 0, $4, $5, 0, 1, NOW())
               ON CONFLICT (branch_code, product_id) DO NOTHING`,
              branch.code,
              dto.id,
              dto.stock,
              dto.minStock ?? 0,
              dto.maxStock ?? 0,
            );
          }
        }
      }
      return product;
    });
  }

  async findById(id: string): Promise<Product | null> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT p.id, p.sku, p.barcode, p.name, p.description, p.category_id, p.cost, p.price, p.type,
         p.track_stock, p.is_active, p.image_public_id, p.image_url, p.created_at, p.updated_at,
         coalesce(sum(ist.qty), 0) as stock,
         coalesce(max(ist.min_qty), 0) as min_stock,
         coalesce(max(ist.max_qty), 0) as max_stock
         FROM products p
         LEFT JOIN inventory_stocks ist ON ist.product_id = p.id
         WHERE p.id = $1
         GROUP BY p.id, p.sku, p.barcode, p.name, p.description, p.category_id, p.cost, p.price, p.type,
                  p.track_stock, p.is_active, p.image_public_id, p.image_url, p.created_at, p.updated_at`,
        id,
      );
      return rows.length > 0 ? this.mapToDomain(rows[0]) : null;
    });
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT p.id, p.sku, p.barcode, p.name, p.description, p.category_id, p.cost, p.price, p.type,
         p.track_stock, p.is_active, p.image_public_id, p.image_url, p.created_at, p.updated_at,
         coalesce(sum(ist.qty), 0) as stock,
         coalesce(max(ist.min_qty), 0) as min_stock,
         coalesce(max(ist.max_qty), 0) as max_stock
         FROM products p
         LEFT JOIN inventory_stocks ist ON ist.product_id = p.id
         WHERE p.sku = $1
         GROUP BY p.id, p.sku, p.barcode, p.name, p.description, p.category_id, p.cost, p.price, p.type,
                  p.track_stock, p.is_active, p.image_public_id, p.image_url, p.created_at, p.updated_at`,
        sku,
      );
      return rows.length > 0 ? this.mapToDomain(rows[0]) : null;
    });
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT p.id, p.sku, p.barcode, p.name, p.description, p.category_id, p.cost, p.price, p.type,
         p.track_stock, p.is_active, p.image_public_id, p.image_url, p.created_at, p.updated_at,
         coalesce(sum(ist.qty), 0) as stock,
         coalesce(max(ist.min_qty), 0) as min_stock,
         coalesce(max(ist.max_qty), 0) as max_stock
         FROM products p
         LEFT JOIN inventory_stocks ist ON ist.product_id = p.id
         WHERE p.barcode = $1
         GROUP BY p.id, p.sku, p.barcode, p.name, p.description, p.category_id, p.cost, p.price, p.type,
                  p.track_stock, p.is_active, p.image_public_id, p.image_url, p.created_at, p.updated_at`,
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
        `SELECT p.id, p.sku, p.barcode, p.name, p.description, p.category_id, p.cost, p.price, p.type,
         p.track_stock, p.is_active, p.image_public_id, p.image_url, p.created_at, p.updated_at,
         coalesce(sum(ist.qty), 0) as stock,
         coalesce(max(ist.min_qty), 0) as min_stock,
         coalesce(max(ist.max_qty), 0) as max_stock
         FROM products p
         LEFT JOIN inventory_stocks ist ON ist.product_id = p.id
         WHERE p.id IN (${placeholders})
         GROUP BY p.id, p.sku, p.barcode, p.name, p.description, p.category_id, p.cost, p.price, p.type,
                  p.track_stock, p.is_active, p.image_public_id, p.image_url, p.created_at, p.updated_at`,
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
      if (filter.status) {
        if (filter.status === 'ACTIVE') {
          conditions.push('is_active = true');
        } else if (filter.status === 'INACTIVE') {
          conditions.push('is_active = false');
        }
      }
      if (filter.type) {
        conditions.push(`type = $${paramIdx}`);
        params.push(filter.type);
        paramIdx++;
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
        `SELECT p.id, p.sku, p.barcode, p.name, p.description, p.category_id, p.cost, p.price, p.type,
         p.track_stock, p.is_active, p.image_public_id, p.image_url, p.created_at, p.updated_at,
         coalesce(sum(ist.qty), 0) as stock,
         coalesce(max(ist.min_qty), 0) as min_stock,
         coalesce(max(ist.max_qty), 0) as max_stock
         FROM products p
         LEFT JOIN inventory_stocks ist ON ist.product_id = p.id
         ${where}
         GROUP BY p.id, p.sku, p.barcode, p.name, p.description, p.category_id, p.cost, p.price, p.type,
                  p.track_stock, p.is_active, p.image_public_id, p.image_url, p.created_at, p.updated_at
         ORDER BY p."${sortBy}" ${sortOrder} LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
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
        `SELECT p.id, p.sku, p.barcode, p.name, p.description, p.category_id, p.cost, p.price, p.type,
         p.track_stock, p.is_active, p.image_public_id, p.image_url, p.created_at, p.updated_at,
         coalesce(sum(ist.qty), 0) as stock,
         coalesce(max(ist.min_qty), 0) as min_stock,
         coalesce(max(ist.max_qty), 0) as max_stock
         FROM products p
         LEFT JOIN inventory_stocks ist ON ist.product_id = p.id
         WHERE p.track_stock = true AND p.is_active = true
         GROUP BY p.id, p.sku, p.barcode, p.name, p.description, p.category_id, p.cost, p.price, p.type,
                  p.track_stock, p.is_active, p.image_public_id, p.image_url, p.created_at, p.updated_at
         HAVING coalesce(sum(ist.qty), 0) <= coalesce(max(ist.min_qty), 0)
         ORDER BY stock ASC`,
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
      stock: Number(row.stock ?? 0),
      minStock: Number(row.min_stock ?? 0),
      maxStock: row.max_stock ? Number(row.max_stock) : undefined,
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
