import { ulid } from 'ulid';
import { ProductNotFoundError, ProductSkuAlreadyExistsError, ProductBarcodeAlreadyExistsError } from '../errors/catalog-errors.js';

export type ProductType = 'GOOD' | 'SERVICE' | 'BUNDLE';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';

export interface ProductVariant {
  id: string;
  sku: string;
  barcode?: string;
  attributes: Record<string, string>;
  price: number;
  cost: number;
  trackStock: boolean;
  stock: number;
  minStock: number;
}

export interface ProductImage {
  publicId: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
}

export interface ProductProps {
  id: ProductId;
  tenantId: string;
  categoryId?: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  type: ProductType;
  status: ProductStatus;
  price: number;
  cost: number;
  taxRate: number;
  trackStock: boolean;
  stock: number;
  minStock: number;
  maxStock?: number;
  variants: ProductVariant[];
  images: ProductImage[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export class ProductId {
  private constructor(public readonly value: string) {}

  static generate(): ProductId {
    return new ProductId(ulid());
  }

  static fromString(value: string): ProductId {
    if (!value || value.length !== 26) {
      throw new Error(`ProductId inválido: ${value}`);
    }
    return new ProductId(value);
  }

  equals(other: ProductId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export class Product {
  private props: ProductProps;

  private constructor(props: ProductProps) {
    this.props = props;
  }

  static create(props: {
    tenantId: string;
    createdBy: string;
    name: string;
    sku: string;
    categoryId?: string;
    description?: string;
    barcode?: string;
    type?: ProductType;
    price: number;
    cost: number;
    taxRate?: number;
    trackStock?: boolean;
    initialStock?: number;
    minStock?: number;
    maxStock?: number;
    costPerUnit?: number;
  }): Product {
    const now = new Date();
    return new Product({
      id: ProductId.generate(),
      tenantId: props.tenantId,
      categoryId: props.categoryId,
      name: props.name.trim(),
      description: props.description?.trim(),
      sku: props.sku.trim().toUpperCase(),
      barcode: props.barcode?.trim(),
      type: props.type ?? 'GOOD',
      status: 'DRAFT',
      price: props.price,
      cost: props.cost ?? 0,
      taxRate: props.taxRate ?? 0,
      trackStock: props.trackStock ?? true,
      stock: props.initialStock ?? 0,
      minStock: props.minStock ?? 0,
      maxStock: props.maxStock,
      variants: [],
      images: [],
      tags: [],
      createdAt: now,
      updatedAt: now,
      createdBy: props.createdBy,
    });
  }

  static rehydrate(props: ProductProps): Product {
    return new Product(props);
  }

  get id(): ProductId { return this.props.id; }
  get tenantId(): string { return this.props.tenantId; }
  get categoryId(): string | undefined { return this.props.categoryId; }
  get name(): string { return this.props.name; }
  get description(): string | undefined { return this.props.description; }
  get sku(): string { return this.props.sku; }
  get barcode(): string | undefined { return this.props.barcode; }
  get type(): ProductType { return this.props.type; }
  get status(): ProductStatus { return this.props.status; }
  get price(): number { return this.props.price; }
  get cost(): number { return this.props.cost; }
  get taxRate(): number { return this.props.taxRate; }
  get trackStock(): boolean { return this.props.trackStock; }
  get stock(): number { return this.props.stock; }
  get minStock(): number { return this.props.minStock; }
  get maxStock(): number | undefined { return this.props.maxStock; }
  get variants(): ProductVariant[] { return this.props.variants; }
  get images(): ProductImage[] { return this.props.images; }
  get tags(): string[] { return this.props.tags; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get createdBy(): string { return this.props.createdBy; }

  get isLowStock(): boolean {
    return this.props.trackStock && this.props.stock <= this.props.minStock;
  }

  get isOutOfStock(): boolean {
    return this.props.trackStock && this.props.stock <= 0;
  }

  updateName(name: string): void {
    this.props.name = name.trim();
    this.touch();
  }

  updateDescription(description?: string): void {
    this.props.description = description?.trim();
    this.touch();
  }

  updateCategory(categoryId?: string): void {
    this.props.categoryId = categoryId;
    this.touch();
  }

  updateSku(sku: string): void {
    this.props.sku = sku.trim().toUpperCase();
    this.touch();
  }

  updateBarcode(barcode?: string): void {
    this.props.barcode = barcode?.trim();
    this.touch();
  }

  updatePrice(price: number): void {
    if (price < 0) throw new Error('El precio no puede ser negativo');
    this.props.price = price;
    this.touch();
  }

  updateCost(cost: number): void {
    if (cost < 0) throw new Error('El costo no puede ser negativo');
    this.props.cost = cost;
    this.touch();
  }

  updateTaxRate(rate: number): void {
    if (rate < 0 || rate > 1) throw new Error('La tasa de impuesto debe estar entre 0 y 1');
    this.props.taxRate = rate;
    this.touch();
  }

  updateTrackStock(track: boolean): void {
    this.props.trackStock = track;
    this.touch();
  }

  updateStock(stock: number): void {
    if (stock < 0) throw new Error('El stock no puede ser negativo');
    this.props.stock = stock;
    this.touch();
  }

  addStock(quantity: number): void {
    if (quantity <= 0) throw new Error('La cantidad debe ser positiva');
    this.props.stock += quantity;
    this.touch();
  }

  removeStock(quantity: number): void {
    if (quantity <= 0) throw new Error('La cantidad debe ser positiva');
    if (this.props.trackStock && this.props.stock < quantity) {
      throw new Error('Stock insuficiente');
    }
    this.props.stock -= quantity;
    this.touch();
  }

  updateMinStock(min: number): void {
    if (min < 0) throw new Error('El stock mínimo no puede ser negativo');
    this.props.minStock = min;
    this.touch();
  }

  updateMaxStock(max?: number): void {
    this.props.maxStock = max;
    this.touch();
  }

  updateStockSettings(trackStock: boolean, minStock: number, maxStock?: number): void {
    this.props.trackStock = trackStock;
    this.props.minStock = minStock;
    this.props.maxStock = maxStock;
    this.touch();
  }

  addVariant(variant: Omit<ProductVariant, 'id'>): ProductVariant {
    const newVariant: ProductVariant = {
      ...variant,
      id: ulid(),
    };
    this.props.variants.push(newVariant);
    this.touch();
    return newVariant;
  }

  removeVariant(variantId: string): void {
    const idx = this.props.variants.findIndex(v => v.id === variantId);
    if (idx === -1) throw new Error('Variante no encontrada');
    this.props.variants.splice(idx, 1);
    this.touch();
  }

  addImage(image: Omit<ProductImage, 'isPrimary'>): ProductImage {
    const newImage: ProductImage = {
      ...image,
      isPrimary: this.props.images.length === 0,
    };
    this.props.images.push(newImage);
    this.touch();
    return newImage;
  }

  removeImage(publicId: string): void {
    const idx = this.props.images.findIndex(i => i.publicId === publicId);
    if (idx === -1) throw new Error('Imagen no encontrada');
    this.props.images.splice(idx, 1);
    const firstImage = this.props.images[0];
    if (firstImage && !firstImage.isPrimary) {
      firstImage.isPrimary = true;
    }
    this.touch();
  }

  addTag(tag: string): void {
    const normalized = tag.trim().toLowerCase();
    if (!this.props.tags.includes(normalized)) {
      this.props.tags.push(normalized);
      this.touch();
    }
  }

  removeTag(tag: string): void {
    const idx = this.props.tags.indexOf(tag.trim().toLowerCase());
    if (idx !== -1) {
      this.props.tags.splice(idx, 1);
      this.touch();
    }
  }

  activate(): void {
    this.props.status = 'ACTIVE';
    this.touch();
  }

  deactivate(): void {
    this.props.status = 'INACTIVE';
    this.touch();
  }

  discontinue(): void {
    this.props.status = 'DISCONTINUED';
    this.touch();
  }

  publish(): void {
    if (this.props.status === 'DRAFT') {
      this.props.status = 'ACTIVE';
      this.touch();
    }
  }

  toDTO(): ProductDTO {
    return {
      id: this.props.id.toString(),
      tenantId: this.props.tenantId,
      categoryId: this.props.categoryId,
      name: this.props.name,
      description: this.props.description,
      sku: this.props.sku,
      barcode: this.props.barcode,
      type: this.props.type,
      status: this.props.status,
      price: this.props.price,
      cost: this.props.cost,
      taxRate: this.props.taxRate,
      trackStock: this.props.trackStock,
      stock: this.props.stock,
      minStock: this.props.minStock,
      maxStock: this.props.maxStock,
      variants: this.props.variants,
      images: this.props.images,
      tags: this.props.tags,
      isLowStock: this.isLowStock,
      isOutOfStock: this.isOutOfStock,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      createdBy: this.props.createdBy,
    };
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}

export interface ProductDTO {
  id: string;
  tenantId: string;
  categoryId?: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  type: ProductType;
  status: ProductStatus;
  price: number;
  cost: number;
  taxRate: number;
  trackStock: boolean;
  stock: number;
  minStock: number;
  maxStock?: number;
  variants: ProductVariant[];
  images: ProductImage[];
  tags: string[];
  isLowStock: boolean;
  isOutOfStock: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}