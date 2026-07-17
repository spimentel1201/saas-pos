import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CheckoutItemDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  qty!: number;

  @ApiProperty({ example: 12.5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional({ example: 0.16 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  taxRate?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class CheckoutPaymentDto {
  @ApiProperty({ enum: ['CASH', 'CARD', 'TRANSFER', 'CREDIT', 'MIXED'] })
  @IsEnum(['CASH', 'CARD', 'TRANSFER', 'CREDIT', 'MIXED'])
  method!: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT' | 'MIXED';

  @ApiProperty({ example: 25.0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ref?: string;
}

export class CheckoutDto {
  @ApiProperty()
  @IsString()
  branchCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cashierSessionId?: number;

  @ApiProperty({ type: [CheckoutItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];

  @ApiProperty({ type: [CheckoutPaymentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutPaymentDto)
  payments!: CheckoutPaymentDto[];

  @ApiPropertyOptional()
  @IsOptional()
  meta?: Record<string, unknown>;
}

export class SaleQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  branchCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: ['COMPLETED', 'VOID', 'RETURNED', 'PARTIAL_RETURN'] })
  @IsOptional()
  @IsEnum(['COMPLETED', 'VOID', 'RETURNED', 'PARTIAL_RETURN'])
  status?: 'COMPLETED' | 'VOID' | 'RETURNED' | 'PARTIAL_RETURN';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

export class VoidSaleDto {}

export class ReturnItemDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.0001)
  qty!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  taxRate?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discount?: number;
}

export class ReturnDto {
  @ApiProperty()
  @IsString()
  @IsUUID()
  saleId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ type: [ReturnItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items!: ReturnItemDto[];
}

export class SaleDTO {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  branchCode!: string;

  @ApiProperty()
  userId!: string;

  @ApiPropertyOptional()
  cashierSessionId?: number;

  @ApiProperty()
  numberSeq!: number;

  @ApiPropertyOptional()
  customerId?: string;

  @ApiProperty()
  subtotal!: number;

  @ApiProperty()
  tax!: number;

  @ApiProperty()
  discount!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty({ enum: ['COMPLETED', 'VOID', 'RETURNED', 'PARTIAL_RETURN'] })
  status!: 'COMPLETED' | 'VOID' | 'RETURNED' | 'PARTIAL_RETURN';

  @ApiProperty()
  meta!: Record<string, unknown>;

  @ApiProperty()
  items!: any[];

  @ApiProperty()
  payments!: any[];

  @ApiProperty()
  cashReceived!: number;

  @ApiProperty()
  createdAt!: Date;
}

export class ReturnDTO {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  saleId!: string;

  @ApiPropertyOptional()
  reason?: string;

  @ApiProperty()
  items!: any[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  createdAt!: Date;
}
