import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class AdjustStockDto {
  @ApiPropertyOptional({ example: 50, description: 'Nueva cantidad absoluta' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  newQty?: number;

  @ApiPropertyOptional({ example: -3, description: 'Delta a aplicar (positivo o negativo)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  delta?: number;

  @ApiPropertyOptional({ example: 'Conteo cíclico' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minQty?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxQty?: number;
}

export class TransferItemDto {
  @ApiProperty()
  @IsString()
  productId!: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  qty!: number;
}

export class CreateTransferDto {
  @ApiProperty({ example: 'MEX01' })
  @IsString()
  fromBranch!: string;

  @ApiProperty({ example: 'GDL01' })
  @IsString()
  toBranch!: string;

  @ApiProperty({ type: [TransferItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items!: TransferItemDto[];
}

export class ReceiveTransferDto {
  @ApiPropertyOptional({
    description: 'Costo unitario por productId para recalcular costo promedio',
    example: { '01J...': 12.5 },
  })
  @IsOptional()
  unitCosts?: Record<string, number>;
}
