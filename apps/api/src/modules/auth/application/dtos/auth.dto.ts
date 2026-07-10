import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
  @ApiProperty({ type: String, example: 'TecnoMania SA' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  businessName!: string;

  @ApiProperty({
    type: String,
    example: 'tecnomania',
    description: 'Identificador kebab-case unico',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9][a-z0-9-]+[a-z0-9]$/, {
    message: 'slug debe ser kebab-case (a-z, 0-9, guiones internos)',
  })
  slug!: string;

  @ApiProperty({ type: String, example: 'Juan Perez' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  ownerName!: string;

  @ApiProperty({ type: String, example: 'owner@tecnomania.com' })
  @IsEmail()
  ownerEmail!: string;

  @ApiProperty({ type: String, example: 'S3cur3P@ss!', minLength: 10 })
  @IsString()
  @MinLength(10)
  @MaxLength(100)
  password!: string;
}

export class LoginDto {
  @ApiProperty({ type: String, example: 'owner@tecnomania.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ type: String, example: 'S3cur3P@ss!' })
  @IsString()
  @MinLength(1)
  password!: string;
}

export class RefreshDto {
  @ApiProperty({ type: String, example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  refreshToken!: string;
}

export class InviteDto {
  @ApiProperty({ type: String, example: 'nuevo@tecnomania.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ type: String, example: 'MANAGER', enum: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] })
  @IsString()
  role!: 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER';

  @ApiProperty({ type: String, example: 'Ana Garcia' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;
}
