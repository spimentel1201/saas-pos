import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({ example: 'Sucursal Centro' })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'CEN01' })
  @IsString()
  @MaxLength(50)
  code!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ default: 'America/Lima' })
  @IsOptional()
  @IsString()
  timezone?: string;
}

export class UpdateBranchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

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
  timezone?: string;
}

export class CreateTaxDto {
  @ApiProperty({ example: 'IGV 18%' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 0.18,
    description: 'Tasa como fraccion para PERCENT (18% = 0.18). Maximo 9.9999',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(9.9999)
  rate!: number;

  @ApiProperty({ enum: ['PERCENT', 'EXEMPT', 'FIXED'] })
  @IsEnum(['PERCENT', 'EXEMPT', 'FIXED'] as const)
  type!: 'PERCENT' | 'EXEMPT' | 'FIXED';
}

export class UpdateTaxDto {
  @ApiPropertyOptional({ example: 'IGV 18%' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 0.18, description: 'Tasa como fraccion (18% = 0.18)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(9.9999)
  rate?: number;
}

export class UpdateSettingsDto {
  @ApiProperty({ description: 'Mapa de key-value para actualizar' })
  @IsObject()
  settings!: Record<string, unknown>;
}

export class UpdateTicketHeaderDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}
