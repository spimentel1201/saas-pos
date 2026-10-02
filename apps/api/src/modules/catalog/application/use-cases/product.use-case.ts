import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ConflictError } from '../../../../shared/domain/errors/domain-error.js';
import { CATEGORY_REPO, PRODUCT_REPO, TENANT_SCHEMA } from '../../catalog.tokens.js';
import { Product } from '../../domain/entities/product.entity.js';
import type { ProductDTO, ProductType } from '../../domain/entities/product.entity.js';
import { Barcode } from '../../domain/value-objects/barcode.js';
import { Sku } from '../../domain/value-objects/sku.js';
import type {
  CategoryRepositoryPort,
  ProductRepositoryPort,
} from '../ports/catalog.repository.port.js';

interface CreateProductInput {
  name: string;
  sku?: string;
  description?: string;
  type?: string;
  barcode?: string;
  categoryId?: string;
  price: number;
  cost?: number;
  taxRate?: number;
  trackStock?: boolean;
  initialStock?: number;
  /** Sucursal donde cargar el stock inicial (codigo, ej. CEN01). */
  branchCode?: string;
  minStock?: number;
  maxStock?: number;
  imageUrl?: string;
  imagePublicId?: string;
}

interface UpdateProductInput {
  name?: string;
  description?: string;
  sku?: string;
  barcode?: string;
  type?: string;
  price?: number;
  cost?: number;
  categoryId?: string;
  trackStock?: boolean;
  minStock?: number;
  maxStock?: number;
  taxRate?: number;
  imageUrl?: string | null;
  imagePublicId?: string | null;
}

interface SearchFilters {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'sku' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  [key: string]: unknown;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ProductUseCases {
  constructor(
    @Inject(PRODUCT_REPO) private readonly productRepo: ProductRepositoryPort,
    @Inject(CATEGORY_REPO) private readonly categoryRepo: CategoryRepositoryPort,
    @Inject(TENANT_SCHEMA) private readonly tenantSchema: string,
  ) {}

  async create(tenantId: string, createdBy: string, dto: CreateProductInput): Promise<ProductDTO> {
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

    const type = ((dto.type as ProductType) ?? 'GOOD') as ProductType;
    const product = Product.create({
      tenantId,
      createdBy,
      name: dto.name,
      sku: sku.toString(),
      description: dto.description,
      type,
      barcode: dto.barcode,
      categoryId: dto.categoryId,
      price: dto.price,
      cost: dto.cost ?? 0,
      taxRate: dto.taxRate ?? 0,
      trackStock: dto.trackStock ?? true,
      initialStock: dto.initialStock,
      minStock: dto.minStock ?? 0,
      maxStock: dto.maxStock,
      imageUrl: dto.imageUrl,
      imagePublicId: dto.imagePublicId,
    });

    let initialBranchCode: string | undefined;
    if (this.tracksStock(dto.trackStock, type)) {
      initialBranchCode = await this.resolveInitialBranch(dto.branchCode);
    }

    return (await this.productRepo.save(product, { initialBranchCode })).toDTO();
  }

  /** Un producto consume stock solo si lo controla y no es servicio. */
  private tracksStock(trackStock: boolean | undefined, type: ProductType): boolean {
    return (trackStock ?? true) && type !== 'SERVICE';
  }

  /**
   * Valida la sucursal destino del stock inicial y devuelve su codigo.
   * Falla con 409 si el negocio no tiene sucursales activas o si la
   * sucursal pedida no pertenece al negocio.
   */
  private async resolveInitialBranch(requested?: string): Promise<string> {
    const codes = await this.productRepo.findActiveBranchCodes();
    if (codes.length === 0) {
      throw new ConflictError(
        'El negocio no tiene sucursales activas. Crea una en Configuración › Sucursales antes de registrar productos con stock.',
      );
    }
    if (requested && !codes.includes(requested)) {
      throw new ConflictError(`La sucursal ${requested} no existe o no está activa en este negocio.`);
    }
    const first = codes[0];
    if (!first) {
      throw new ConflictError('El negocio no tiene sucursales activas.');
    }
    return requested ?? first;
  }

  async getById(id: string): Promise<ProductDTO> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product.toDTO();
  }

  async getBySku(sku: string): Promise<ProductDTO> {
    const product = await this.productRepo.findBySku(sku);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product.toDTO();
  }

  async getByBarcode(barcode: string): Promise<ProductDTO> {
    const product = await this.productRepo.findByBarcode(barcode);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product.toDTO();
  }

  async update(id: string, dto: UpdateProductInput): Promise<ProductDTO> {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundException('Producto no encontrado');

    if (dto.name) product.updateName(dto.name);
    if (dto.description !== undefined) product.updateDescription(dto.description);
    if (dto.sku !== undefined) product.updateSku(dto.sku);
    if (dto.price !== undefined) product.updatePrice(dto.price);
    if (dto.cost !== undefined) product.updateCost(dto.cost);
    if (dto.barcode !== undefined) product.updateBarcode(dto.barcode);
    if (dto.type !== undefined) product.updateType(dto.type as ProductType);
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
    if (dto.imageUrl !== undefined || dto.imagePublicId !== undefined) {
      product.updateImage(dto.imagePublicId ?? null, dto.imageUrl ?? null);
    }

    const persistStockBounds = dto.minStock !== undefined || dto.maxStock !== undefined;
    return (await this.productRepo.save(product, { persistStockBounds })).toDTO();
  }

  async changeStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED',
  ): Promise<ProductDTO> {
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

  async search(_tenantId: string, filters: SearchFilters): Promise<PaginatedResult<ProductDTO>> {
    const filter = {
      ...filters,
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      sortBy: filters.sortBy ?? 'name',
      sortOrder: filters.sortOrder ?? 'asc',
    };
    const result = await this.productRepo.findAll(filter);
    return {
      data: result.data.map((p) => p.toDTO()),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async getLowStock(tenantId: string): Promise<ProductDTO[]> {
    const products = await this.productRepo.findLowStock(tenantId);
    return products.map((p) => p.toDTO());
  }

  async searchByBarcode(barcode: string): Promise<ProductDTO> {
    const product = await this.productRepo.findByBarcode(barcode);
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product.toDTO();
  }
}
