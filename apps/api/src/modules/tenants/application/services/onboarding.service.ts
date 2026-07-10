import { Injectable } from '@nestjs/common';
import { ulid } from 'ulid';
import { ConflictError, NotFoundError } from '../../../../shared/domain/errors/domain-error.js';
import { TenantContext } from '../../../../shared/infrastructure/multi-tenant/tenant-context.js';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service.js';
import { TenantPrismaService } from '../../../../shared/infrastructure/prisma/tenant-prisma.service.js';
import type {
  CreateBranchDto,
  CreateOnboardingProductDto,
  CreateTaxDto,
} from '../dtos/onboarding.dto.js';
import type { BranchDto, TaxDto, TenantDto, UsageDto } from '../dtos/tenant-output.dto.js';

/**
 * OnboardingService - orquesta los 3 pasos del wizard de alta:
 *   1. branch   - primera sucursal (lista para vender)
 *   2. tax      - impuesto por defecto (ej IVA)
 *   3. product  - primer producto
 *
 * Cada paso tiene idempotencia suave: si el tenant ya tiene una branch,
 * step 1 devuelve la existente en vez de crear otra.
 */
@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly ctx: TenantContext,
  ) {}

  async getTenantProfile(): Promise<TenantDto> {
    const t = TenantContext.current;
    if (!t) throw new NotFoundError('No hay tenant activo');
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: t.id },
      select: { id: true, name: true, slug: true, plan: true, status: true },
    });
    if (!tenant) throw new NotFoundError('Tenant no encontrado');
    const onboardingComplete = await this.isOnboardingComplete();
    return { ...tenant, onboardingComplete };
  }

  // ---- STEP 1: branch ----
  async createBranch(dto: CreateBranchDto): Promise<BranchDto> {
    const tenantId = TenantContext.require.id;

    // Idempotencia: si ya hay branch code igual, devolverla
    const existing = await this.prisma.branch.findUnique({
      where: { tenantId_code: { tenantId, code: dto.code } },
    });
    if (existing) {
      return {
        id: existing.id,
        code: existing.code,
        name: existing.name,
        createdAt: existing.createdAt,
      };
    }

    // Verificar limite del plan
    await this.assertBranchLimit(tenantId);

    const branch = await this.prisma.branch.create({
      data: {
        id: ulid(),
        tenantId,
        name: dto.name,
        code: dto.code,
      },
    });
    return { id: branch.id, code: branch.code, name: branch.name, createdAt: branch.createdAt };
  }

  // ---- STEP 2: tax ----
  async createTax(dto: CreateTaxDto): Promise<TaxDto> {
    return this.tenantPrisma.withTenant(async (tx) => {
      // Idempotencia por nombre
      const existing = (await tx.$queryRaw`
        SELECT id, name, rate, type FROM taxes WHERE name = ${dto.name} LIMIT 1
      `) as Array<{ id: string; name: string; rate: number; type: string }>;
      if (existing.length > 0 && existing[0]) {
        return existing[0];
      }
      const id = ulid();
      await tx.$executeRaw`
        INSERT INTO taxes (id, name, rate, type) VALUES (${id}, ${dto.name}, ${dto.rate}, ${dto.type})
      `;
      return { id, name: dto.name, rate: dto.rate, type: dto.type };
    });
  }

  // ---- STEP 3: primer producto ----
  async createOnboardingProduct(dto: CreateOnboardingProductDto): Promise<{ id: string }> {
    return this.tenantPrisma.withTenant(async (tx) => {
      const tenantId = TenantContext.require.id;
      await this.assertProductLimit(tenantId);

      const id = ulid();
      const sku = dto.sku ?? `SKU-${id.slice(-6).toUpperCase()}`;
      // Para el primer producto, sin tax asignado y sin categoria (wizard basico).
      await tx.$executeRaw`
        INSERT INTO products (id, sku, barcode, name, price, cost, type, track_stock, is_active)
        VALUES (${id}, ${sku}, ${dto.barcode ?? null}, ${dto.name},
                ${dto.price}, ${dto.cost ?? 0}, 'GOOD',
                ${dto.trackStock ?? true}, true)
      `;
      return { id };
    });
  }

  async listBranches(): Promise<BranchDto[]> {
    const tenantId = TenantContext.require.id;
    const branches = await this.prisma.branch.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
    });
    return branches.map((b: (typeof branches)[number]) => ({
      id: b.id,
      code: b.code,
      name: b.name,
      createdAt: b.createdAt,
    }));
  }

  async getUsage(): Promise<UsageDto> {
    const t = TenantContext.require;
    const period = new Date().toISOString().slice(0, 7); // YYYY-MM
    const counter = await this.prisma.usageCounter.findUnique({
      where: { tenantId_period: { tenantId: t.id, period } },
    });
    const limits = this.planLimits(t.plan);
    return {
      period,
      branchCount: counter?.branchCount ?? 0,
      productCount: counter?.productCount ?? 0,
      saleCount: counter?.saleCount ?? 0,
      limits,
    };
  }

  // ---- helpers ----

  private async isOnboardingComplete(): Promise<boolean> {
    const t = TenantContext.require;
    const branchCount = await this.prisma.branch.count({ where: { tenantId: t.id } });
    if (branchCount === 0) return false;
    // Comprobamos si existe al menos un tax y un product en el schema tenant.
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
    return tenantStats.taxes > 0 && tenantStats.products > 0;
  }

  private planLimits(plan: string): { branches: number | null; products: number | null } {
    switch (plan) {
      case 'STARTER':
        return { branches: 1, products: 200 };
      case 'GROWTH':
        return { branches: 5, products: null };
      case 'PRO':
        return { branches: null, products: null };
      default:
        return { branches: 1, products: 200 };
    }
  }

  private async assertBranchLimit(tenantId: string): Promise<void> {
    const plan = TenantContext.require.plan;
    const limits = this.planLimits(plan);
    if (limits.branches === null) return;
    const count = await this.prisma.branch.count({ where: { tenantId } });
    if (count >= limits.branches) {
      throw new ConflictError(
        `Plan ${plan} limita a ${limits.branches} sucursales. Upgrade a Growth/Pro.`,
      );
    }
  }

  private async assertProductLimit(_tenantId: string): Promise<void> {
    const plan = TenantContext.require.plan;
    const limits = this.planLimits(plan);
    if (limits.products === null) return;
    const count = await this.tenantPrisma.withTenant(async (tx) => {
      const rows = (await tx.$queryRaw`
        SELECT count(*)::bigint AS count FROM products
      `) as Array<{ count: bigint }>;
      return Number(rows[0]?.count ?? 0n);
    });
    if (count >= limits.products) {
      throw new ConflictError(
        `Plan ${plan} limita a ${limits.products} productos. Upgrade a Growth/Pro.`,
      );
    }
  }
}
