import type { BranchInfo, Tenant } from '../../domain/entities/tenant.entity.js';
import type { Plan } from '../../domain/value-objects/plan.vo.js';

export interface OnboardingStats {
  branches: number;
  taxes: number;
  products: number;
}

export interface UsageData {
  period: string;
  branchCount: number;
  productCount: number;
  saleCount: number;
  limits: { branches: number | null; products: number | null };
}

export interface TaxRow {
  id: string;
  name: string;
  rate: number;
  type: string;
}

export interface TenantRepositoryPort {
  findById(id: string): Promise<Tenant | null>;
  findBranchByCode(tenantId: string, code: string): Promise<BranchInfo | null>;
  createBranch(tenantId: string, name: string, code: string): Promise<BranchInfo>;
  listBranches(tenantId: string): Promise<BranchInfo[]>;
  countBranches(tenantId: string): Promise<number>;
  countProducts(): Promise<number>;
  findTaxByName(name: string): Promise<TaxRow | null>;
  createTax(name: string, rate: number, type: string): Promise<TaxRow>;
  createOnboardingProduct(dto: {
    name: string;
    sku?: string;
    barcode?: string;
    price: number;
    cost?: number;
    trackStock?: boolean;
  }): Promise<{ id: string }>;
  getOnboardingStats(): Promise<OnboardingStats>;
  getUsage(tenantId: string, plan: Plan): Promise<UsageData>;
}

export interface TenantLookupPort {
  findBySlug(slug: string): Promise<Tenant | null>;
  findByDomain(domain: string): Promise<Tenant | null>;
}
