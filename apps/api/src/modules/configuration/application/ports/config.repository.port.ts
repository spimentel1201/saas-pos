import type { Branch, BranchDTO } from '../../domain/entities/branch.entity.js';
import type { Tax, TaxDTO } from '../../domain/entities/tax.entity.js';
import type {
  TenantSetting,
  TenantSettingDTO,
} from '../../domain/entities/tenant-settings.entity.js';

export interface BranchRepositoryPort {
  findById(id: string): Promise<Branch | null>;
  findByCode(code: string): Promise<Branch | null>;
  findAll(activeOnly?: boolean): Promise<BranchDTO[]>;
  save(branch: Branch): Promise<Branch>;
  delete(id: string): Promise<void>;
}

export interface TaxRepositoryPort {
  findById(id: string): Promise<Tax | null>;
  findAll(): Promise<TaxDTO[]>;
  save(tax: Tax): Promise<Tax>;
  delete(id: string): Promise<void>;
}

export interface SettingsRepositoryPort {
  findAll(): Promise<TenantSettingDTO[]>;
  findByKey(key: string): Promise<TenantSetting | null>;
  upsert(key: string, value: unknown): Promise<TenantSetting>;
  upsertMany(settings: Record<string, unknown>): Promise<TenantSettingDTO[]>;
}
