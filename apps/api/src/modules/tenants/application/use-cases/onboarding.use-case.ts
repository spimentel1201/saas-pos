import { Inject, Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError } from '../../../../shared/domain/errors/domain-error.js';
import { TenantContext } from '../../../../shared/infrastructure/multi-tenant/tenant-context.js';
import {
  type Plan,
  assertBranchLimit,
  assertProductLimit,
} from '../../domain/value-objects/plan.vo.js';
import { TENANT_REPO } from '../../tenants.tokens.js';
import type {
  CreateBranchDto,
  CreateOnboardingProductDto,
  CreateTaxDto,
} from '../dtos/onboarding.dto.js';
import type { BranchDto, TaxDto, TenantDto, UsageDto } from '../dtos/tenant-output.dto.js';
import type { TenantRepositoryPort } from '../ports/tenant.repository.port.js';

/**
 * OnboardingUseCases - orquesta los 3 pasos del wizard de alta:
 *   1. branch   - primera sucursal (lista para vender)
 *   2. tax      - impuesto por defecto (ej IVA)
 *   3. product  - primer producto
 *
 * Cada paso tiene idempotencia suave: si el tenant ya tiene una branch,
 * step 1 devuelve la existente en vez de crear otra.
 */
@Injectable()
export class OnboardingUseCases {
  constructor(@Inject(TENANT_REPO) private readonly repo: TenantRepositoryPort) {}

  async getTenantProfile(): Promise<TenantDto> {
    const t = TenantContext.current;
    if (!t) throw new NotFoundError('No hay tenant activo');
    const tenant = await this.repo.findById(t.id);
    if (!tenant) throw new NotFoundError('Tenant no encontrado');

    const stats = await this.repo.getOnboardingStats();
    const onboardingComplete = stats.branches > 0 && stats.taxes > 0 && stats.products > 0;

    return {
      ...tenant.toDTO(),
      onboardingComplete,
    };
  }

  // ---- STEP 1: branch ----
  async createBranch(dto: CreateBranchDto): Promise<BranchDto> {
    const t = TenantContext.require;

    const existing = await this.repo.findBranchByCode(t.id, dto.code);
    if (existing) return existing.toDTO();

    const branchCount = await this.repo.countBranches(t.id);
    try {
      assertBranchLimit(t.plan as Plan, branchCount);
    } catch (e) {
      throw new ConflictError((e as Error).message);
    }

    const branch = await this.repo.createBranch(t.id, dto.name, dto.code);
    return branch.toDTO();
  }

  // ---- STEP 2: tax ----
  async createTax(dto: CreateTaxDto): Promise<TaxDto> {
    const stats = await this.repo.getOnboardingStats();
    if (stats.taxes > 0) {
      const existing = await this.findTaxByName(dto.name);
      if (existing) return existing;
    }

    const tax = await this.repo.createTax(dto.name, dto.rate, dto.type);
    return tax;
  }

  // ---- STEP 3: primer producto ----
  async createOnboardingProduct(dto: CreateOnboardingProductDto): Promise<{ id: string }> {
    const t = TenantContext.require;
    const productCount = await this.repo.countProducts();
    try {
      assertProductLimit(t.plan as Plan, productCount);
    } catch (e) {
      throw new ConflictError((e as Error).message);
    }

    return this.repo.createOnboardingProduct(dto);
  }

  async listBranches(): Promise<BranchDto[]> {
    const t = TenantContext.require;
    const branches = await this.repo.listBranches(t.id);
    return branches.map((b) => b.toDTO());
  }

  async getUsage(): Promise<UsageDto> {
    const t = TenantContext.require;
    const usage = await this.repo.getUsage(t.id, t.plan as Plan);
    return usage;
  }

  private async findTaxByName(name: string): Promise<TaxDto | null> {
    const tax = await this.repo.findTaxByName(name);
    if (!tax) return null;
    return { id: tax.id, name: tax.name, rate: tax.rate, type: tax.type };
  }
}
