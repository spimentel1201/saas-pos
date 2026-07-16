import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, Min, Max, IsBoolean, IsArray, ValidateNested, IsNumberString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Coca-Cola 500ml' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Bebida gaseosa refrescante' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'CC-500' })
  @IsString()
  sku!: string;

  @ApiPropertyOptional({ example: '7791234567890' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: 'cat_123', description: 'ID de la categoría' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiProperty({ example: 450.5, description: 'Precio de venta' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 300, description: 'Costo unitario' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ example: 0.21, description: 'Tasa de impuesto (0-1)', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  taxRate?: number;

  @ApiPropertyOptional({ example: 'GOOD', enum: ['GOOD', 'SERVICE', 'BUNDLE'], default: 'GOOD' })
  @IsOptional()
  @IsEnum(['GOOD', 'SERVICE', 'BUNDLE'])
  type?: 'GOOD' | 'SERVICE' | 'BUNDLE';

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  trackStock?: boolean;

  @ApiPropertyOptional({ example: 10, description: 'Stock inicial', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  initialStock?: number;

  @ApiPropertyOptional({ example: 5, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxStock?: number;

  @ApiPropertyOptional({ example: ['bebida', 'gaseosa', 'promo'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Coca-Cola 500ml Nueva Presentación' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Nueva descripción' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'cat_456' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 480 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 320 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost?: number;

  @ApiPropertyOptional({ example: 0.21 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(1)
  taxRate?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  trackStock?: boolean;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minStock?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxStock?: number;

  @ApiPropertyOptional({ example: ['bebida', 'novedad'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'Bebidas' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'cat_parent_123' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ example: 'Categoría de bebidas gaseosas y jugos' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 10, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Bebidas Frías' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'cat_parent_456' })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({ example: 'Nueva descripción' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ProductQueryDto {
  @ApiPropertyOptional({ example: 'coca', description: 'Búsqueda por nombre/SKU/barcode' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ example: 'cat_123' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ['GOOD', 'SERVICE', 'BUNDLE'] })
  @IsOptional()
  @IsEnum(['GOOD', 'SERVICE', 'BUNDLE'])
  type?: 'GOOD' | 'SERVICE' | 'BUNDLE';

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE', 'DISCONTINUED'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE', 'DISCONTINUED'])
  status?: 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasStock?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  lowStock?: boolean;

  @ApiPropertyOptional({ example: ['bebida', 'promo'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ enum: ['name', 'sku', 'price', 'createdAt', 'updatedAt'] })
  @IsOptional()
  @IsEnum(['name', 'sku', 'price', 'createdAt', 'updatedAt'])
  sortBy?: 'name' | 'sku' | 'price' | 'createdAt' | 'updatedAt';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class ProductDTO {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  sku!: string;

  @ApiPropertyOptional()
  barcode?: string;

  @ApiProperty({ enum: ['GOOD', 'SERVICE', 'BUNDLE'] })
  type!: 'GOOD' | 'SERVICE' | 'BUNDLE';

  @ApiProperty({ enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'DISCONTINUED'] })
  status!: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'DISCONTINUED';

  @ApiProperty()
  price!: number;

  @ApiProperty()
  cost!: number;

  @ApiProperty()
  taxRate!: number;

  @ApiProperty()
  trackStock!: boolean;

  @ApiProperty()
  stock!: number;

  @ApiProperty()
  minStock!: number;

  @ApiPropertyOptional()
  maxStock?: number;

  @ApiProperty()
  variants!: any[];

  @ApiProperty()
  images!: any[];

  @ApiProperty()
  tags!: string[];

  @ApiProperty()
  isLowStock!: boolean;

  @ApiProperty()
  isOutOfStock!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty()
  createdBy!: string;
}

export class CategoryDTO {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiPropertyOptional()
  parentId?: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PaginatedProductDTO {
  @ApiProperty({ type: [ProductDTO] })
  data!: ProductDTO[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}