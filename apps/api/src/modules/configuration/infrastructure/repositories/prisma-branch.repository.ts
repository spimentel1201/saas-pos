import { Injectable } from '@nestjs/common';
import { TenantContext } from '../../../../shared/infrastructure/multi-tenant/tenant-context.js';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service.js';
import { TenantPrismaService } from '../../../../shared/infrastructure/prisma/tenant-prisma.service.js';
import type { BranchRepositoryPort } from '../../application/ports/config.repository.port.js';
import { Branch, type BranchDTO } from '../../domain/entities/branch.entity.js';

/**
 * Hay dos fuentes de verdad de "sucursal" y deben mantenerse sincronizadas:
 *
 *  - `public."Branch"`  (Prisma compartida): limites de plan y control de
 *    onboarding. Solo guarda id/tenantId/name/code.
 *  - `<schema>.branches` (schema tenant): toda la data transaccional
 *    (stock, ventas, caja) referencian `branch_code`, y `GET /branches` lee
 *    de aqui.
 *
 * Este repositorio escribe primero en el schema tenant (es lo que la app lee)
 * y luego replica en la tabla compartida.
 */
@Injectable()
export class PrismaBranchRepository implements BranchRepositoryPort {
  constructor(
    private readonly tenantPrisma: TenantPrismaService,
    private readonly prisma: PrismaService,
  ) {}

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
    const saved = await this.tenantPrisma.withTenant(async (tx) => {
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

    // Replica en la tabla compartida (limites de plan / onboarding).
    // Llave natural: (tenantId, code) — los ids de cada tabla no coinciden.
    await this.prisma.branch.upsert({
      where: { tenantId_code: { tenantId: TenantContext.require.id, code: dto.code } },
      update: { name: dto.name },
      create: { tenantId: TenantContext.require.id, name: dto.name, code: dto.code },
    });

    return saved;
  }

  async delete(id: string): Promise<void> {
    const branch = await this.findById(id);
    await this.tenantPrisma.withTenant(async (tx) => {
      await tx.$executeRawUnsafe('DELETE FROM branches WHERE id = $1', id);
    });
    if (branch) {
      await this.prisma.branch.deleteMany({
        where: { tenantId: TenantContext.require.id, code: branch.code },
      });
    }
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
