import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BRANCH_REPO, SETTINGS_REPO, TAX_REPO } from '../../config.tokens.js';
import { Branch } from '../../domain/entities/branch.entity.js';
import type { BranchDTO } from '../../domain/entities/branch.entity.js';
import { Tax } from '../../domain/entities/tax.entity.js';
import type { TaxDTO } from '../../domain/entities/tax.entity.js';
import type { TenantSettingDTO } from '../../domain/entities/tenant-settings.entity.js';
import type {
  BranchRepositoryPort,
  SettingsRepositoryPort,
  TaxRepositoryPort,
} from '../ports/config.repository.port.js';

interface CreateBranchInput {
  name: string;
  code: string;
  address?: string;
  city?: string;
  timezone?: string;
}

interface UpdateBranchInput {
  name?: string;
  address?: string;
  city?: string;
  timezone?: string;
}

interface CreateTaxInput {
  name: string;
  rate: number;
  type: 'PERCENT' | 'EXEMPT' | 'FIXED';
}

@Injectable()
export class BranchUseCases {
  constructor(@Inject(BRANCH_REPO) private readonly branchRepo: BranchRepositoryPort) {}

  async create(dto: CreateBranchInput): Promise<BranchDTO> {
    const existing = await this.branchRepo.findByCode(dto.code);
    if (existing) {
      throw new ConflictException(`Sucursal con codigo ${dto.code} ya existe`);
    }

    const branch = Branch.create(dto);
    const saved = await this.branchRepo.save(branch);
    return saved.toDTO();
  }

  async getById(id: string): Promise<BranchDTO> {
    const branch = await this.branchRepo.findById(id);
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    return branch.toDTO();
  }

  async list(): Promise<BranchDTO[]> {
    return this.branchRepo.findAll(true);
  }

  async update(id: string, dto: UpdateBranchInput): Promise<BranchDTO> {
    const branch = await this.branchRepo.findById(id);
    if (!branch) throw new NotFoundException('Sucursal no encontrada');

    if (dto.name) branch.updateName(dto.name);
    branch.updateDetails({
      address: dto.address,
      city: dto.city,
      timezone: dto.timezone,
    });

    const saved = await this.branchRepo.save(branch);
    return saved.toDTO();
  }

  async delete(id: string): Promise<void> {
    const branch = await this.branchRepo.findById(id);
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    branch.deactivate();
    await this.branchRepo.save(branch);
  }
}

@Injectable()
export class TaxUseCases {
  constructor(@Inject(TAX_REPO) private readonly taxRepo: TaxRepositoryPort) {}

  async create(dto: CreateTaxInput): Promise<TaxDTO> {
    const tax = Tax.create(dto);
    const saved = await this.taxRepo.save(tax);
    return saved.toDTO();
  }

  async getById(id: string): Promise<TaxDTO> {
    const tax = await this.taxRepo.findById(id);
    if (!tax) throw new NotFoundException('Impuesto no encontrado');
    return tax.toDTO();
  }

  async list(): Promise<TaxDTO[]> {
    return this.taxRepo.findAll();
  }

  async update(id: string, dto: { name?: string; rate?: number }): Promise<TaxDTO> {
    const tax = await this.taxRepo.findById(id);
    if (!tax) throw new NotFoundException('Impuesto no encontrado');

    if (dto.name) tax.updateName(dto.name);
    if (dto.rate !== undefined) tax.updateRate(dto.rate);

    const saved = await this.taxRepo.save(tax);
    return saved.toDTO();
  }

  async delete(id: string): Promise<void> {
    await this.taxRepo.delete(id);
  }
}

@Injectable()
export class SettingsUseCases {
  constructor(@Inject(SETTINGS_REPO) private readonly settingsRepo: SettingsRepositoryPort) {}

  async getAll(): Promise<TenantSettingDTO[]> {
    return this.settingsRepo.findAll();
  }

  async getByKey(key: string): Promise<TenantSettingDTO> {
    const setting = await this.settingsRepo.findByKey(key);
    if (!setting) throw new NotFoundException(`Configuracion ${key} no encontrada`);
    return setting.toDTO();
  }

  async updateMany(settings: Record<string, unknown>): Promise<TenantSettingDTO[]> {
    return this.settingsRepo.upsertMany(settings);
  }

  async updateTicketHeader(header: {
    businessName?: string;
    logoUrl?: string;
    address?: string;
    phone?: string;
  }): Promise<TenantSettingDTO> {
    const current = await this.settingsRepo.findByKey('ticket_header');
    const currentVal = (current?.value ?? {}) as Record<string, string>;
    const merged = { ...currentVal, ...header };
    const setting = await this.settingsRepo.upsert('ticket_header', merged);
    return setting.toDTO();
  }
}
