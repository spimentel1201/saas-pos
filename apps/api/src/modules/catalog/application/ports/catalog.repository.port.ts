import { Category } from '../../domain/entities/category.entity.js';
import { Product } from '../../domain/entities/product.entity.js';

export interface ProductFilter {
  search?: string;
  categoryId?: string;
  type?: 'GOOD' | 'SERVICE' | 'BUNDLE';
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';
  minPrice?: number;
  maxPrice?: number;
  hasStock?: boolean;
  lowStock?: boolean;
  tags?: string[];
  sortBy?: 'name' | 'sku' | 'price' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SaveProductOptions {
  /**
   * Sucursal donde cargar el stock inicial. Solo aplica al alta del producto.
   * Si no se indica, el repository elige la primera sucursal activa.
   */
  initialBranchCode?: string;
  /**
   * Propagar `minStock`/`maxStock` del producto a `inventory_stocks`.
   * Solo en actualizacion, para no pisar umbrales por sucursal en el alta.
   */
  persistStockBounds?: boolean;
}

export interface ProductRepositoryPort {
  save(product: Product, options?: SaveProductOptions): Promise<Product>;
  /** Codigos de las sucursales activas del tenant (schema tenant, no la tabla compartida). */
  findActiveBranchCodes(): Promise<string[]>;
  findById(id: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findByBarcode(barcode: string): Promise<Product | null>;
  findByIds(ids: string[]): Promise<Product[]>;
  findAll(filter: ProductFilter): Promise<PaginatedResult<Product>>;
  findByCategory(
    categoryId: string,
    filter?: Omit<ProductFilter, 'categoryId'>,
  ): Promise<PaginatedResult<Product>>;
  findLowStock(tenantId: string): Promise<Product[]>;
  delete(id: string): Promise<void>;
  existsBySku(sku: string, excludeId?: string): Promise<boolean>;
  existsByBarcode(barcode: string, excludeId?: string): Promise<boolean>;
}

export interface CategoryRepositoryPort {
  save(category: Category): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  findByName(name: string, tenantId: string): Promise<Category | null>;
  findAll(tenantId: string, includeInactive?: boolean): Promise<Category[]>;
  findByParent(parentId?: string, tenantId?: string): Promise<Category[]>;
  findChildren(id: string): Promise<Category[]>;
  findTree(tenantId: string): Promise<Category[]>;
  findActiveByTenant(tenantId: string): Promise<Category[]>;
  delete(id: string): Promise<void>;
  hasChildren(id: string): Promise<boolean>;
}

export const PRODUCT_REPO = Symbol('PRODUCT_REPO');
export const CATEGORY_REPO = Symbol('CATEGORY_REPO');
