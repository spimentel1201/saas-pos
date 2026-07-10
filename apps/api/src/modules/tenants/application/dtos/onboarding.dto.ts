import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ type: String, example: 'Sucursal Centro' })
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ type: String, example: 'CEN01' })
  @MinLength(2)
  @MaxLength(10)
  code!: string;

  @ApiProperty({ type: String, example: 'Av. Corrientes 1234', required: false })
  @IsOptional()
  @MaxLength(200)
  address?: string;

  @ApiProperty({ type: String, example: 'America/Argentina/Buenos_Aires', required: false })
  @IsOptional()
  timezone?: string;
}

export class CreateTaxDto {
  @ApiProperty({ type: String, example: 'IVA' })
  @MinLength(2)
  @MaxLength(60)
  name!: string;

  @ApiProperty({ type: Number, example: 0.21, description: 'Tasa entre 0 y 1' })
  @IsNumber()
  @Min(0)
  @Max(1)
  rate!: number;

  @ApiProperty({ type: String, example: 'PERCENT', enum: ['PERCENT', 'EXEMPT', 'FIXED'] })
  @IsIn(['PERCENT', 'EXEMPT', 'FIXED'])
  type!: 'PERCENT' | 'EXEMPT' | 'FIXED';
}

export class CreateOnboardingProductDto {
  @ApiProperty({ type: String, example: 'Coca-Cola 500ml' })
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiProperty({ type: String, example: 'CC-500', required: false })
  @IsOptional()
  sku?: string;

  @ApiProperty({ type: String, example: '7791234567890', required: false })
  @IsOptional()
  barcode?: string;

  @ApiProperty({ type: Number, example: 450.5 })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({ type: Number, example: 300, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @ApiProperty({ type: Boolean, example: true, required: false })
  @IsOptional()
  trackStock?: boolean;
}
