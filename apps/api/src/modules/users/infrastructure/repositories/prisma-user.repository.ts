import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service.js';
import type { Role } from '../../../auth/domain/entities/user.entity.js';
import type { UserRepositoryPort } from '../../application/ports/user.repository.port.js';
import type { TenantUserInfo } from '../../domain/entities/user-info.entity.js';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async listByTenant(tenantId: string): Promise<TenantUserInfo[]> {
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL on shared schema
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT tu."userId", tu."tenantId", tu.role,
              u.name, u.email, tu."tenantId" as "tenantIdRaw"
       FROM "TenantUser" tu
       JOIN "User" u ON u.id = tu."userId"
       WHERE tu."tenantId" = $1
       ORDER BY u.name ASC`,
      tenantId,
    );
    return rows.map((r) => ({
      userId: r.userId,
      tenantId: r.tenantId,
      role: r.role as Role,
      name: r.name,
      email: r.email,
      createdAt: new Date(),
    }));
  }

  async findByUserAndTenant(userId: string, tenantId: string): Promise<TenantUserInfo | null> {
    // biome-ignore lint/suspicious/noExplicitAny: raw SQL on shared schema
    const rows = await this.prisma.$queryRawUnsafe<any[]>(
      `SELECT tu."userId", tu."tenantId", tu.role,
              u.name, u.email
       FROM "TenantUser" tu
       JOIN "User" u ON u.id = tu."userId"
       WHERE tu."userId" = $1 AND tu."tenantId" = $2`,
      userId,
      tenantId,
    );
    if (rows.length === 0 || !rows[0]) return null;
    const r = rows[0];
    return {
      userId: r.userId,
      tenantId: r.tenantId,
      role: r.role as Role,
      name: r.name,
      email: r.email,
      createdAt: new Date(),
    };
  }

  async updateRole(userId: string, tenantId: string, role: Role): Promise<TenantUserInfo> {
    await this.prisma.$executeRawUnsafe(
      `UPDATE "TenantUser" SET role = $1 WHERE "userId" = $2 AND "tenantId" = $3`,
      role,
      userId,
      tenantId,
    );
    const result = await this.findByUserAndTenant(userId, tenantId);
    if (!result) throw new Error('Usuario no encontrado despues de actualizar');
    return result;
  }

  async removeFromTenant(userId: string, tenantId: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM "TenantUser" WHERE "userId" = $1 AND "tenantId" = $2`,
      userId,
      tenantId,
    );
  }

  async inviteToTenant(tenantId: string, email: string, role: Role): Promise<TenantUserInfo> {
    const user = await this.prisma.$queryRawUnsafe<{ id: string; name: string }[]>(
      `SELECT id, name FROM "User" WHERE email = $1`,
      email,
    );
    if (user.length === 0 || !user[0]) {
      throw new Error(`Usuario con email ${email} no encontrado. Debe registrarse primero.`);
    }

    const existing = await this.prisma.$queryRawUnsafe<{ userId: string }[]>(
      `SELECT "userId" FROM "TenantUser" WHERE "userId" = $1 AND "tenantId" = $2`,
      user[0].id,
      tenantId,
    );
    if (existing.length > 0) {
      throw new Error(`Usuario ${email} ya es miembro de este tenant`);
    }

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "TenantUser" ("userId", "tenantId", role) VALUES ($1, $2, $3)`,
      user[0].id,
      tenantId,
      role,
    );

    return {
      userId: user[0].id,
      tenantId,
      role,
      name: user[0].name,
      email,
      createdAt: new Date(),
    };
  }
}
