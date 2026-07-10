import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensDto {
  @ApiProperty({ type: String, example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken!: string;

  @ApiProperty({ type: String, example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken!: string;

  @ApiProperty({ type: String, example: 'clxxxxxxxxxxxxxxxxxxxxx' })
  userId!: string;

  @ApiProperty({ type: String, example: 'OWNER' })
  primaryRole!: string;

  @ApiProperty({ type: String, example: 'tecnomania' })
  tenantSlug!: string;
}

export class PublicUserDto {
  @ApiProperty({ type: String, example: 'clxxxxxxxxxxxxxxxxxxxxx' })
  id!: string;

  @ApiProperty({ type: String, example: 'owner@tecnomania.com' })
  email!: string;

  @ApiProperty({ type: String, example: 'Juan Perez' })
  name!: string;

  @ApiProperty({ type: String, example: '2024-01-15T10:30:00.000Z', nullable: true })
  emailVerified!: Date | null;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: { slug: { type: 'string' }, role: { type: 'string' }, name: { type: 'string' } },
    },
    example: [{ slug: 'tecnomania', role: 'OWNER', name: 'TecnoMania SA' }],
  })
  tenants!: Array<{ slug: string; role: string; name: string }>;
}

export class InviteResultDto {
  @ApiProperty({ type: String, example: 'inv_xxxxxxxxxxxxxxxxxxxxxxxx' })
  inviteToken!: string;

  @ApiProperty({ type: String, example: '2024-01-22T10:30:00.000Z' })
  expiresAt!: Date;

  @ApiProperty({ type: String, example: 'https://app.pos.test/accept-invite?token=inv_xxx' })
  signupUrl!: string;
}
