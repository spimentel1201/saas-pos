import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../../../../shared/infrastructure/prisma/tenant-prisma.service.js';
import type { TaxRepositoryPort } from '../../application/ports/config.repository.port.js';
import { Tax, type TaxDTO } from '../../domain/entities/tax.entity.js';

@Injectable()
export class PrismaTaxRepository implements TaxRepositoryPort {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async findById(id: string): Promise<Tax | null> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        'SELECT id, name, rate, type, created_at FROM taxes WHERE id = $1',
        id,
      );
      return rows.length > 0 ? this.mapToTax(rows[0]) : null;
    });
  }

  async findAll(): Promise<TaxDTO[]> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        'SELECT id, name, rate, type, created_at FROM taxes ORDER BY name ASC',
      );
      return rows.map((r) => this.mapToTax(r).toDTO());
    });
  }

  async save(tax: Tax): Promise<Tax> {
    const dto = tax.toDTO();
    return this.tenantPrisma.withTenant(async (tx) => {
      if (dto.id) {
        await tx.$executeRawUnsafe(
          'UPDATE taxes SET name = $1, rate = $2 WHERE id = $3',
          dto.name,
          dto.rate,
          dto.id,
        );
        return tax;
      }
      const inserted = await tx.$queryRawUnsafe<{ id: string }[]>(
        `INSERT INTO taxes (id, name, rate, type)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        crypto.randomUUID(),
        dto.name,
        dto.rate,
        dto.type,
      );
      if (inserted.length > 0 && inserted[0]) {
        return Tax.rehydrate({ ...dto, id: inserted[0].id });
      }
      return tax;
    });
  }

  async delete(id: string): Promise<void> {
    await this.tenantPrisma.withTenant(async (tx) => {
      await tx.$executeRawUnsafe('DELETE FROM taxes WHERE id = $1', id);
    });
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw SQL row mapping
  private mapToTax(row: any): Tax {
    return Tax.rehydrate({
      id: row.id,
      name: row.name,
      rate: Number(row.rate),
      type: row.type,
      createdAt: new Date(row.created_at),
    });
  }
}
