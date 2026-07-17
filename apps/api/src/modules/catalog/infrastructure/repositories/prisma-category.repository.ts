import { Inject, Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../../../../shared/infrastructure/prisma/tenant-prisma.service.js';
import { CategoryRepositoryPort } from '../../application/ports/catalog.repository.port.js';
import { TENANT_SCHEMA } from '../../catalog.tokens.js';
import { Category } from '../../domain/entities/category.entity.js';
import { CategoryId } from '../../domain/entities/category.entity.js';

@Injectable()
export class PrismaCategoryRepository implements CategoryRepositoryPort {
  constructor(
    @Inject(TENANT_SCHEMA) private readonly tenantSchema: string,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  async save(category: Category): Promise<Category> {
    const dto = category.toDTO();
    return this.tenantPrisma.withTenant(async (tx) => {
      const existing = await tx.$queryRawUnsafe<{ id: string }[]>(
        'SELECT id FROM categories WHERE id = $1',
        dto.id,
      );
      if (existing.length > 0) {
        await tx.$executeRawUnsafe(
          'UPDATE categories SET name = $1, parent_id = $2 WHERE id = $3',
          dto.name,
          dto.parentId ?? null,
          dto.id,
        );
      } else {
        await tx.$executeRawUnsafe(
          'INSERT INTO categories (id, parent_id, name, created_at) VALUES ($1, $2, $3, NOW())',
          dto.id,
          dto.parentId ?? null,
          dto.name,
        );
      }
      return category;
    });
  }

  async findById(id: string): Promise<Category | null> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      const rows = await tx.$queryRawUnsafe<any[]>(
        'SELECT id, parent_id, name, created_at FROM categories WHERE id = $1',
        id,
      );
      return rows.length > 0 ? this.toDomain(rows[0]) : null;
    });
  }

  async findByName(name: string, _tenantId: string): Promise<Category | null> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      const rows = await tx.$queryRawUnsafe<any[]>(
        'SELECT id, parent_id, name, created_at FROM categories WHERE name = $1',
        name,
      );
      return rows.length > 0 ? this.toDomain(rows[0]) : null;
    });
  }

  async findAll(_tenantId: string, _includeInactive = false): Promise<Category[]> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      const rows = await tx.$queryRawUnsafe<any[]>(
        'SELECT id, parent_id, name, created_at FROM categories ORDER BY name ASC',
      );
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      return rows.map((r: any) => this.toDomain(r));
    });
  }

  async findByParent(parentId?: string, _tenantId?: string): Promise<Category[]> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const rows =
        parentId === undefined
          ? // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
            await tx.$queryRawUnsafe<any[]>(
              'SELECT id, parent_id, name, created_at FROM categories WHERE parent_id IS NULL',
            )
          : // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
            await tx.$queryRawUnsafe<any[]>(
              'SELECT id, parent_id, name, created_at FROM categories WHERE parent_id = $1',
              parentId,
            );
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      return rows.map((r: any) => this.toDomain(r));
    });
  }

  async findChildren(id: string): Promise<Category[]> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      const rows = await tx.$queryRawUnsafe<any[]>(
        'SELECT id, parent_id, name, created_at FROM categories WHERE parent_id = $1',
        id,
      );
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      return rows.map((r: any) => this.toDomain(r));
    });
  }

  async findTree(_tenantId: string): Promise<Category[]> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      const rows = await tx.$queryRawUnsafe<any[]>(
        'SELECT id, parent_id, name, created_at FROM categories ORDER BY name ASC',
      );
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
      return rows.map((r: any) => this.toDomain(r));
    });
  }

  async findActiveByTenant(tenantId: string): Promise<Category[]> {
    return this.findAll(tenantId, false);
  }

  async delete(id: string): Promise<void> {
    return this.tenantPrisma.withTenant(async (tx) => {
      await tx.$executeRawUnsafe('DELETE FROM categories WHERE id = $1', id);
    });
  }

  async hasChildren(id: string): Promise<boolean> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const rows = await tx.$queryRawUnsafe<{ count: bigint }[]>(
        'SELECT COUNT(*) as count FROM categories WHERE parent_id = $1',
        id,
      );
      return Number(rows[0]?.count ?? 0) > 0;
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw SQL queries
  private toDomain(row: any): Category {
    return Category.rehydrate({
      id: CategoryId.fromString(row.id),
      tenantId: this.tenantSchema,
      parentId: row.parent_id,
      name: row.name,
      description: '',
      sortOrder: 0,
      isActive: true,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.created_at),
    });
  }
}
