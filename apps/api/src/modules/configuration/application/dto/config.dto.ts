import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

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
  @ApiProperty({ example: 'IVA 16%' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 0.16 })
  rate!: number;

  @ApiProperty({ enum: ['PERCENT', 'EXEMPT', 'FIXED'] })
  @IsEnum(['PERCENT', 'EXEMPT', 'FIXED'] as const)
  type!: 'PERCENT' | 'EXEMPT' | 'FIXED';
}

export class UpdateTaxDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  rate?: number;
}

export class UpdateSettingsDto {
  @ApiProperty({ description: 'Mapa de key-value para actualizar' })
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
