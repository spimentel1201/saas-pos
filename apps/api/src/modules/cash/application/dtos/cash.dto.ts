import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class OpenCashSessionDto {
  @ApiProperty({ example: 'BRANCH01' })
  @IsString()
  branchCode!: string;

  @ApiProperty({ example: 500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  openingBalance!: number;
}

export class CloseCashSessionDto {
  @ApiProperty({ example: 15450.5 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  countedBalance!: number;

  @ApiPropertyOptional({ example: 'Cierre turno mañana' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AddCashMovementDto {
  @ApiProperty({ enum: ['IN', 'OUT', 'REFUND'] })
  @IsEnum(['IN', 'OUT', 'REFUND'])
  type!: 'IN' | 'OUT' | 'REFUND';

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ example: 'Cambio para caja' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CashSessionQueryDto {
  @ApiPropertyOptional({ example: 'BRANCH01' })
  @IsOptional()
  @IsString()
  branchCode?: string;

  @ApiPropertyOptional({ enum: ['OPEN', 'CLOSED', 'RECONCILING'] })
  @IsOptional()
  @IsEnum(['OPEN', 'CLOSED', 'RECONCILING'])
  status?: 'OPEN' | 'CLOSED' | 'RECONCILING';

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CashMovementResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  sessionId!: number;

  @ApiProperty({ enum: ['IN', 'OUT', 'SALE', 'REFUND'] })
  type!: 'IN' | 'OUT' | 'SALE' | 'REFUND';

  @ApiProperty()
  amount!: number;

  @ApiPropertyOptional()
  reason?: string;

  @ApiProperty()
  createdAt!: Date;
}

export class CashSessionResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  branchCode!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  openedAt!: Date;

  @ApiPropertyOptional()
  closedAt?: Date;

  @ApiProperty()
  openingBalance!: number;

  @ApiPropertyOptional()
  expectedBalance?: number;

  @ApiPropertyOptional()
  countedBalance?: number;

  @ApiPropertyOptional()
  difference?: number;

  @ApiProperty({ enum: ['OPEN', 'CLOSED', 'RECONCILING'] })
  status!: 'OPEN' | 'CLOSED' | 'RECONCILING';

  @ApiPropertyOptional()
  notes?: string;
}

export class PaginatedCashSessionsDto {
  @ApiProperty({ type: [CashSessionResponseDto] })
  data!: CashSessionResponseDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;
}
