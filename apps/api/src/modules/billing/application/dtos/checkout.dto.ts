import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUrl } from 'class-validator';

export class CheckoutDto {
  @ApiProperty({ type: String, example: 'STARTER', enum: ['STARTER', 'GROWTH', 'PRO'] })
  @IsEnum(['STARTER', 'GROWTH', 'PRO'])
  plan!: 'STARTER' | 'GROWTH' | 'PRO';

  @ApiProperty({ type: String, example: 'https://app.pos.test/onboarding/done' })
  @IsUrl()
  successUrl!: string;

  @ApiProperty({ type: String, example: 'https://app.pos.test/billing' })
  @IsUrl()
  cancelUrl!: string;
}
