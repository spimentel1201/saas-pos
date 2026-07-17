import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import type { Role } from '../../../auth/domain/entities/user.entity.js';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] })
  @IsEnum(['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] as const)
  role!: Role;
}

export class InviteUserDto {
  @ApiProperty({ example: 'nuevo@email.com' })
  @IsString()
  email!: string;

  @ApiProperty({ enum: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'], default: 'CASHIER' })
  @IsOptional()
  @IsEnum(['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] as const)
  role?: Role;
}

export class UserQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
