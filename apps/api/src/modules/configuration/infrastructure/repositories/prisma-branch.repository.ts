import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../../../../shared/infrastructure/prisma/tenant-prisma.service.js';
import type { BranchRepositoryPort } from '../../application/ports/config.repository.port.js';
import { Branch, type BranchDTO } from '../../domain/entities/branch.entity.js';

@Injectable()
export class PrismaBranchRepository implements BranchRepositoryPort {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async findById(id: string): Promise<Branch | null> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, name, code, address, city, timezone, active, created_at, updated_at
         FROM branches WHERE id = $1`,
        id,
      );
      return rows.length > 0 ? this.mapToBranch(rows[0]) : null;
    });
  }

  async findByCode(code: string): Promise<Branch | null> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, name, code, address, city, timezone, active, created_at, updated_at
         FROM branches WHERE code = $1`,
        code,
      );
      return rows.length > 0 ? this.mapToBranch(rows[0]) : null;
    });
  }

  async findAll(activeOnly = true): Promise<BranchDTO[]> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const where = activeOnly ? 'WHERE active = true' : '';
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        `SELECT id, name, code, address, city, timezone, active, created_at, updated_at
         FROM branches ${where}
         ORDER BY name ASC`,
      );
      return rows.map((r) => this.mapToBranch(r).toDTO());
    });
  }

  async save(branch: Branch): Promise<Branch> {
    const dto = branch.toDTO();
    return this.tenantPrisma.withTenant(async (tx) => {
      if (dto.id) {
        await tx.$executeRawUnsafe(
          `UPDATE branches SET name = $1, address = $2, city = $3, timezone = $4,
           active = $5, updated_at = now()
           WHERE id = $6`,
          dto.name,
          dto.address ?? null,
          dto.city ?? null,
          dto.timezone,
          dto.active,
          dto.id,
        );
        return branch;
      }
      const inserted = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO branches (name, code, address, city, timezone)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        dto.name,
        dto.code,
        dto.address ?? null,
        dto.city ?? null,
        dto.timezone,
      );
      if (inserted.length > 0 && inserted[0]) {
        return Branch.rehydrate({ ...dto, id: inserted[0].id });
      }
      return branch;
    });
  }

  async delete(id: string): Promise<void> {
    await this.tenantPrisma.withTenant(async (tx) => {
      await tx.$executeRawUnsafe('DELETE FROM branches WHERE id = $1', id);
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw SQL row mapping
  private mapToBranch(row: any): Branch {
    return Branch.rehydrate({
      id: row.id,
      name: row.name,
      code: row.code,
      address: row.address ?? undefined,
      city: row.city ?? undefined,
      timezone: row.timezone,
      active: row.active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
