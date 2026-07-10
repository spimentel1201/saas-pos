import { ApiProperty } from '@nestjs/swagger';

export class BranchDto {
  @ApiProperty({ type: String, example: 'clxxxxxxxxxxxxxxxxxxxxx' })
  id!: string;

  @ApiProperty({ type: String, example: 'CEN01' })
  code!: string;

  @ApiProperty({ type: String, example: 'Sucursal Centro' })
  name!: string;

  @ApiProperty({ type: String, example: '2024-01-15T10:30:00.000Z' })
  createdAt!: Date;
}

export class TaxDto {
  @ApiProperty({ type: String, example: 'clxxxxxxxxxxxxxxxxxxxxx' })
  id!: string;

  @ApiProperty({ type: String, example: 'IVA' })
  name!: string;

  @ApiProperty({ type: Number, example: 0.21 })
  rate!: number;

  @ApiProperty({ type: String, example: 'PERCENT' })
  type!: string;
}

export class TenantDto {
  @ApiProperty({ type: String, example: 'clxxxxxxxxxxxxxxxxxxxxx' })
  id!: string;

  @ApiProperty({ type: String, example: 'TecnoMania SA' })
  name!: string;

  @ApiProperty({ type: String, example: 'tecnomania' })
  slug!: string;

  @ApiProperty({ type: String, example: 'STARTER', enum: ['STARTER', 'GROWTH', 'PRO'] })
  plan!: string;

  @ApiProperty({
    type: String,
    example: 'TRIALING',
    enum: ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED'],
  })
  status!: string;

  @ApiProperty({ type: Boolean, example: false })
  onboardingComplete!: boolean;
}

export class UsageDto {
  @ApiProperty({ type: String, example: '2024-01' })
  period!: string;

  @ApiProperty({ type: Number, example: 1 })
  branchCount!: number;

  @ApiProperty({ type: Number, example: 12 })
  productCount!: number;

  @ApiProperty({ type: Number, example: 348 })
  saleCount!: number;

  @ApiProperty({
    type: 'object',
    properties: {
      branches: { type: 'number', nullable: true },
      products: { type: 'number', nullable: true },
    },
    example: { branches: 2, products: 100 },
    description: 'Limites del plan (null = ilimitado)',
  })
  limits!: { branches: number | null; products: number | null };
}
