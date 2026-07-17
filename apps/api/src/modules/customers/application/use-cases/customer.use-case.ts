import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CUSTOMER_REPO } from '../../customers.tokens.js';
import { Customer } from '../../domain/entities/customer.entity.js';
import type {
  CustomerDTO,
  CustomerType,
  DocumentType,
} from '../../domain/entities/customer.entity.js';
import type {
  CustomerFilter,
  CustomerRepositoryPort,
  PaginatedCustomers,
  PaginatedPurchaseHistory,
} from '../ports/customer.repository.port.js';

interface CreateCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  type?: CustomerType;
  documentType?: DocumentType;
  documentNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  taxId?: string;
  notes?: string;
}

interface UpdateCustomerInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  taxId?: string;
  notes?: string;
}

@Injectable()
export class CustomerUseCases {
  constructor(@Inject(CUSTOMER_REPO) private readonly customerRepo: CustomerRepositoryPort) {}

  async create(userId: string, dto: CreateCustomerInput): Promise<CustomerDTO> {
    if (dto.documentType && dto.documentNumber) {
      const existing = await this.customerRepo.findByDocument(dto.documentType, dto.documentNumber);
      if (existing) {
        throw new ConflictException(
          `Cliente con ${dto.documentType} ${dto.documentNumber} ya existe`,
        );
      }
    }

    const customer = Customer.create({
      ...dto,
      createdBy: userId,
    });

    const saved = await this.customerRepo.save(customer);
    return saved.toDTO();
  }

  async getById(id: string): Promise<CustomerDTO> {
    const customer = await this.customerRepo.findById(id);
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return customer.toDTO();
  }

  async update(id: string, dto: UpdateCustomerInput): Promise<CustomerDTO> {
    const customer = await this.customerRepo.findById(id);
    if (!customer) throw new NotFoundException('Cliente no encontrado');

    if (dto.name) customer.updateName(dto.name);
    customer.updateContact({
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
      city: dto.city,
      state: dto.state,
      zipCode: dto.zipCode,
    });
    if (dto.taxId !== undefined) customer.updateContact({});
    if (dto.notes !== undefined) customer.updateContact({});
    if (dto.notes !== undefined) (customer as unknown as { notes: string }).notes = dto.notes;

    const saved = await this.customerRepo.save(customer);
    return saved.toDTO();
  }

  async delete(id: string): Promise<void> {
    const customer = await this.customerRepo.findById(id);
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    customer.deactivate();
    await this.customerRepo.save(customer);
  }

  async search(filter: CustomerFilter): Promise<PaginatedCustomers> {
    return this.customerRepo.findAll({
      ...filter,
      page: filter.page ?? 1,
      limit: filter.limit ?? 20,
    });
  }

  async searchPos(query: string, limit?: number): Promise<CustomerDTO[]> {
    return this.customerRepo.searchPos(query, limit ?? 10);
  }

  async adjustCredit(id: string, amount: number): Promise<CustomerDTO> {
    const customer = await this.customerRepo.findById(id);
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    customer.adjustCredit(amount);
    const saved = await this.customerRepo.save(customer);
    return saved.toDTO();
  }

  async getPurchaseHistory(
    id: string,
    page?: number,
    limit?: number,
  ): Promise<PaginatedPurchaseHistory> {
    const customer = await this.customerRepo.findById(id);
    if (!customer) throw new NotFoundException('Cliente no encontrado');
    return this.customerRepo.getPurchaseHistory(id, page ?? 1, limit ?? 20);
  }
}
