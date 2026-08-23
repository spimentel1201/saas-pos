import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { TenantContext } from '../../../../shared/infrastructure/multi-tenant/tenant-context.js';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service.js';
import { TenantPrismaService } from '../../../../shared/infrastructure/prisma/tenant-prisma.service.js';
import type {
  OnboardingStats,
  TaxRow,
  TenantRepositoryPort,
  UsageData,
} from '../../application/ports/tenant.repository.port.js';
import { BranchInfo, Tenant } from '../../domain/entities/tenant.entity.js';
import { type Plan, getPlanLimits } from '../../domain/value-objects/plan.vo.js';

@Injectable()
export class PrismaTenantRepository implements TenantRepositoryPort {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  async findById(id: string): Promise<Tenant | null> {
    const row = await this.prisma.tenant.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        schemaName: true,
        plan: true,
        status: true,
        baseDomain: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!row) return null;
    return Tenant.rehydrate({
      id: row.id,
      name: row.name,
      slug: row.slug,
      schemaName: row.schemaName,
      plan: row.plan as Plan,
      status: row.status,
      baseDomain: row.baseDomain ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findBranchByCode(tenantId: string, code: string): Promise<BranchInfo | null> {
    const row = await this.prisma.branch.findUnique({
      where: { tenantId_code: { tenantId, code } },
    });
    if (!row) return null;
    return BranchInfo.rehydrate({
      id: row.id,
      tenantId,
      name: row.name,
      code: row.code,
      createdAt: row.createdAt,
    });
  }

  async createBranch(tenantId: string, name: string, code: string): Promise<BranchInfo> {
    const branch = await this.prisma.branch.create({
      data: { id: ulid(), tenantId, name, code },
    });
    return BranchInfo.rehydrate({
      id: branch.id,
      tenantId,
      name: branch.name,
      code: branch.code,
      createdAt: branch.createdAt,
    });
  }

  async listBranches(tenantId: string): Promise<BranchInfo[]> {
    const rows = await this.prisma.branch.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((b: any) =>
      BranchInfo.rehydrate({
        id: b.id,
        tenantId,
        name: b.name,
        code: b.code,
        createdAt: b.createdAt,
      }),
    );
  }

  async countBranches(tenantId: string): Promise<number> {
    return this.prisma.branch.count({ where: { tenantId } });
  }

  async countProducts(): Promise<number> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const rows = (await tx.$queryRaw`
        SELECT count(*)::bigint AS count FROM products
      `) as Array<{ count: bigint }>;
      return Number(rows[0]?.count ?? 0n);
    });
  }

  async createTax(name: string, rate: number, type: string): Promise<TaxRow> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const id = ulid();
      await tx.$executeRaw`
        INSERT INTO taxes (id, name, rate, type) VALUES (${id}, ${name}, ${rate}, ${type})
      `;
      return { id, name, rate, type };
    });
  }

  async findTaxByName(name: string): Promise<TaxRow | null> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const rows = (await tx.$queryRaw`
        SELECT id, name, rate, type FROM taxes WHERE name = ${name} LIMIT 1
      `) as TaxRow[];
      return rows.length > 0 && rows[0] ? rows[0] : null;
    });
  }

  async createOnboardingProduct(dto: {
    name: string;
    sku?: string;
    barcode?: string;
    price: number;
    cost?: number;
    trackStock?: boolean;
  }): Promise<{ id: string }> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const id = ulid();
      const sku = dto.sku ?? `SKU-${id.slice(-6).toUpperCase()}`;
      await tx.$executeRaw`
        INSERT INTO products (id, sku, barcode, name, price, cost, type, track_stock, is_active)
        VALUES (${id}, ${sku}, ${dto.barcode ?? null}, ${dto.name},
                ${dto.price}, ${dto.cost ?? 0}, 'GOOD',
                ${dto.trackStock ?? true}, true)
      `;
      return { id };
    });
  }

  async getOnboardingStats(): Promise<OnboardingStats> {
    const t = TenantContext.require;
    const branches = await this.prisma.branch.count({ where: { tenantId: t.id } });
    const tenantStats = await this.tenantPrisma.withTenant(async (tx) => {
      const taxRows = (await tx.$queryRaw`
        SELECT count(*)::bigint AS count FROM taxes
      `) as Array<{ count: bigint }>;
      const productRows = (await tx.$queryRaw`
        SELECT count(*)::bigint AS count FROM products
      `) as Array<{ count: bigint }>;
      return {
        taxes: Number(taxRows[0]?.count ?? 0n),
        products: Number(productRows[0]?.count ?? 0n),
      };
    });
    return { branches, taxes: tenantStats.taxes, products: tenantStats.products };
  }

  async getUsage(tenantId: string, plan: Plan): Promise<UsageData> {
    const period = new Date().toISOString().slice(0, 7);
    const counter = await this.prisma.usageCounter.findUnique({
      where: { tenantId_period: { tenantId, period } },
    });
    return {
      period,
      branchCount: counter?.branchCount ?? 0,
      productCount: counter?.productCount ?? 0,
      saleCount: counter?.saleCount ?? 0,
      limits: getPlanLimits(plan),
    };
  }
}
