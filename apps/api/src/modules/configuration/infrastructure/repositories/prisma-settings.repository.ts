import { Injectable } from '@nestjs/common';
import { TenantPrismaService } from '../../../../shared/infrastructure/prisma/tenant-prisma.service.js';
import type { SettingsRepositoryPort } from '../../application/ports/config.repository.port.js';
import {
  TenantSetting,
  type TenantSettingDTO,
} from '../../domain/entities/tenant-settings.entity.js';

@Injectable()
export class PrismaSettingsRepository implements SettingsRepositoryPort {
  constructor(private readonly tenantPrisma: TenantPrismaService) {}

  async findAll(): Promise<TenantSettingDTO[]> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        'SELECT id, key, value, updated_at FROM tenant_settings ORDER BY key ASC',
      );
      return rows.map((r) => this.mapToSetting(r).toDTO());
    });
  }

  async findByKey(key: string): Promise<TenantSetting | null> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const rows = await tx.$queryRawUnsafe<any[]>(
        'SELECT id, key, value, updated_at FROM tenant_settings WHERE key = $1',
        key,
      );
      return rows.length > 0 ? this.mapToSetting(rows[0]) : null;
    });
  }

  async upsert(key: string, value: unknown): Promise<TenantSetting> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const existing = await tx.$queryRawUnsafe<any[]>(
        'SELECT id FROM tenant_settings WHERE key = $1',
        key,
      );

      if (existing.length > 0 && existing[0]) {
        await tx.$executeRawUnsafe(
          'UPDATE tenant_settings SET value = $1, updated_at = now() WHERE key = $2',
          JSON.stringify(value),
          key,
        );
        // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
        const updated = await tx.$queryRawUnsafe<any[]>(
          'SELECT id, key, value, updated_at FROM tenant_settings WHERE key = $1',
          key,
        );
        return this.mapToSetting(updated[0]);
      }

      // biome-ignore lint/suspicious/noExplicitAny: raw SQL query
      const inserted = await tx.$queryRawUnsafe<any[]>(
        `INSERT INTO tenant_settings (key, value)
         VALUES ($1, $2)
         RETURNING id, key, value, updated_at`,
        key,
        JSON.stringify(value),
      );
      return this.mapToSetting(inserted[0]);
    });
  }

  async upsertMany(settings: Record<string, unknown>): Promise<TenantSettingDTO[]> {
    const results: TenantSettingDTO[] = [];
    for (const [key, value] of Object.entries(settings)) {
      const setting = await this.upsert(key, value);
      results.push(setting.toDTO());
    }
    return results;
  }

  // biome-ignore lint/suspicious/noExplicitAny: raw SQL row mapping
  private mapToSetting(row: any): TenantSetting {
    return TenantSetting.rehydrate({
      id: Number(row.id),
      key: row.key,
      value: typeof row.value === 'string' ? JSON.parse(row.value) : row.value,
      updatedAt: new Date(row.updated_at),
    });
  }
}
