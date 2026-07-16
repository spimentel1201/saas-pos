import { Inject, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import type { ProductRepositoryPort, CategoryRepositoryPort } from '../ports/catalog.repository.port.js';
import { Product } from '../../domain/entities/product.entity.js';
import { Sku } from '../../domain/value-objects/sku.js';
import { Barcode } from '../../domain/value-objects/barcode.js';
import { PRODUCT_REPO, CATEGORY_REPO, TENANT_SCHEMA } from '../../catalog.tokens.js';

@Injectable()
export class ProductUseCases {
  constructor(
    @Inject(PRODUCT_REPO) private readonly productRepo: ProductRepositoryPort,
    @Inject(CATEGORY_REPO) private readonly categoryRepo: CategoryRepositoryPort,
    @Inject(TENANT_SCHEMA) private readonly tenantSchema: string,
  ) {}

  async create(tenantId: string, createdBy: string, dto: any): Promise<any> {
    const sku = dto.sku ? Sku.create(dto.sku) : Sku.generate();
    if (await this.productRepo.existsBySku(sku.toString())) {
      throw new ConflictException(`SKU ya existe: ${sku}`);
    }

    if (dto.barcode) {
      const barcode = Barcode.create(dto.barcode);
      if (await this.productRepo.existsByBarcode(barcode.toString())) {
        throw new ConflictException(`Código de barras ya existe: ${barcode}`);
      }
    }

    if (dto.categoryId) {
      const category = await this.categoryRepo.findById(dto.categoryId);
      if (!category) {
        throw new NotFoundException('Categoría no encontrada');
      }
    }

    const product = Product.create({
      tenantId,
      createdBy,
      name: dto.name,
      sku: sku.toString(),
      description: dto.description,
      type: dto.type ?? 'GOOD',
      barcode: dto.barcode,
      categoryId: dto.categoryId,
      price: dto.price,
      cost: dto.cost,
      taxRate: dto.taxRate ?? 0,
      trackStock: dto.trackStock ?? true,
      initialStock: dto.initialStock,
      minStock: dto.minStock ?? 0,
      maxStock: dto.maxStock,
    });

    return (await this.productRepo.save(product)).toDTO();
  }

  async getById(id: string): Promise<any> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product.toDTO();
  }

  async getBySku(sku: string): Promise<any> {
    const product = await this.productRepo.findBySku(sku);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product.toDTO();
  }

  async getByBarcode(barcode: string): Promise<any> {
    const product = await this.productRepo.findByBarcode(barcode);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product.toDTO();
  }

  async update(id: string, dto: any): Promise<any> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundException('Producto no encontrado');

    if (dto.name) product.updateName(dto.name);
    if (dto.description !== undefined) product.updateDescription(dto.description);
    if (dto.price !== undefined) product.updatePrice(dto.price);
    if (dto.cost !== undefined) product.updateCost(dto.cost);
    if (dto.barcode !== undefined) product.updateBarcode(dto.barcode);
    if (dto.categoryId !== undefined) product.updateCategory(dto.categoryId);
    if (dto.trackStock !== undefined || dto.minStock !== undefined || dto.maxStock !== undefined) {
      product.updateStockSettings(
        dto.trackStock ?? product.trackStock,
        dto.minStock ?? product.minStock,
        dto.maxStock ?? product.maxStock,
      );
    }
    if (dto.taxRate !== undefined) product.updateTaxRate(dto.taxRate);
    if (dto.minStock !== undefined) product.updateMinStock(dto.minStock);
    if (dto.maxStock !== undefined) product.updateMaxStock(dto.maxStock);

    return (await this.productRepo.save(product)).toDTO();
  }

  async changeStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED'): Promise<any> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundException('Producto no encontrado');

    switch (status) {
      case 'ACTIVE':
        product.activate();
        break;
      case 'INACTIVE':
        product.deactivate();
        break;
      case 'DISCONTINUED':
        product.discontinue();
        break;
    }

    return (await this.productRepo.save(product)).toDTO();
  }

  async delete(id: string): Promise<void> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundException('Producto no encontrado');
    await this.productRepo.delete(id);
  }

  async search(tenantId: string, filters: any): Promise<any> {
    const filter = {
      ...filters,
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      sortBy: filters.sortBy ?? 'name',
      sortOrder: filters.sortOrder ?? 'asc',
    };
    const result = await this.productRepo.findAll(filter);
    return {
      data: result.data.map(p => p.toDTO()),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async getLowStock(tenantId: string): Promise<any[]> {
    const products = await this.productRepo.findLowStock(tenantId);
    return products.map(p => p.toDTO());
  }

  async searchByBarcode(barcode: string): Promise<any> {
    const product = await this.productRepo.findByBarcode(barcode);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product.toDTO();
  }
}
