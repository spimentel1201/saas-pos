import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import type { CustomerType, DocumentType } from '../../domain/entities/customer.entity.js';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Juan Perez' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ example: 'juan@email.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '999888777' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ enum: ['INDIVIDUAL', 'BUSINESS'], default: 'INDIVIDUAL' })
  @IsOptional()
  @IsEnum(['INDIVIDUAL', 'BUSINESS'] as const)
  type?: CustomerType;

  @ApiPropertyOptional({ enum: ['DNI', 'RUC', 'CE', 'PASSPORT'] })
  @IsOptional()
  @IsEnum(['DNI', 'RUC', 'CE', 'PASSPORT'] as const)
  documentType?: DocumentType;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  documentNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(20)
  zipCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AdjustCreditDto {
  @ApiProperty({ description: 'Monto a ajustar (positivo sumar, negativo restar)', example: 50 })
  amount!: number;

  @ApiPropertyOptional({ description: 'Razon del ajuste' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CustomerSearchQueryDto {
  @ApiProperty({ description: 'Texto de busqueda (nombre, telefono, email, DNI, RUC)' })
  @IsString()
  q!: string;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  limit?: number;
}

export class CustomerQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['INDIVIDUAL', 'BUSINESS'] })
  @IsOptional()
  @IsEnum(['INDIVIDUAL', 'BUSINESS'] as const)
  type?: CustomerType;

  @ApiPropertyOptional()
  @IsOptional()
  active?: boolean;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ enum: ['name', 'createdAt', 'creditBalance'] })
  @IsOptional()
  @IsEnum(['name', 'createdAt', 'creditBalance'] as const)
  sortBy?: 'name' | 'createdAt' | 'creditBalance';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'] as const)
  sortOrder?: 'asc' | 'desc';
}
