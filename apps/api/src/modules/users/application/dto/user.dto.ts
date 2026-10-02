import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import type { Role } from '../../../auth/domain/entities/user.entity.js';

const ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] as const;

export class UpdateUserRoleDto {
  @ApiProperty({ enum: ROLES })
  @IsEnum(ROLES)
  role!: Role;
}

export class InviteUserDto {
  @ApiProperty({ example: 'nuevo@email.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ enum: ROLES, default: 'CASHIER' })
  @IsOptional()
  @IsEnum(ROLES)
  role?: Role;
}

export class CreateUserDto {
  @ApiProperty({ example: 'Ana Torres' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'ana@email.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ enum: ROLES, default: 'CASHIER' })
  @IsOptional()
  @IsEnum(ROLES)
  role?: Role;

  @ApiPropertyOptional({
    description: 'Si se omite, el servidor genera una clave temporal que se devuelve una sola vez',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Clave nueva del usuario', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class UserQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
