import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../../shared/infrastructure/http/current-user.decorator.js';
import { TenantRequired } from '../../../../shared/infrastructure/multi-tenant/tenant-required.decorator.js';
import {
  CreateUserDto,
  InviteUserDto,
  ResetPasswordDto,
  UpdateUserRoleDto,
} from '../../application/dto/user.dto.js';
import { UserUseCases } from '../../application/use-cases/user.use-case.js';
import { Roles } from '../../domain/decorators/roles.decorator.js';
import { RolesGuard } from '../../domain/guards/roles.guard.js';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
@TenantRequired()
@UseGuards(RolesGuard)
export class UserController {
  constructor(private readonly userUseCases: UserUseCases) {}

  @Get()
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Listar usuarios del tenant (solo OWNER/ADMIN)' })
  async list(@CurrentUser() user: { sub: string; tenantId: string }) {
    return this.userUseCases.listTenantUsers(user.tenantId);
  }

  @Get(':id')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Obtener usuario del tenant (solo OWNER/ADMIN)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async getById(
    @CurrentUser() currentUser: { sub: string; tenantId: string },
    @Param('id') id: string,
  ) {
    return this.userUseCases.getUserInTenant(id, currentUser.tenantId);
  }

  @Post()
  @Roles('OWNER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear usuario en el tenant con clave (solo OWNER)' })
  @ApiBody({ type: CreateUserDto })
  async create(
    @CurrentUser() currentUser: { sub: string; tenantId: string; role: string },
    @Body() dto: CreateUserDto,
  ) {
    return this.userUseCases.create(
      currentUser.tenantId,
      dto,
      currentUser.role as 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER',
    );
  }

  @Patch(':id/role')
  @Roles('OWNER')
  @ApiOperation({ summary: 'Cambiar rol de usuario (solo OWNER)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: UpdateUserRoleDto })
  async updateRole(
    @CurrentUser() currentUser: { sub: string; tenantId: string; role: string },
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
  ) {
    return this.userUseCases.updateRole(
      currentUser.tenantId,
      id,
      dto.role,
      currentUser.role as 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER',
    );
  }

  @Patch(':id/password')
  @Roles('OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer la clave de un usuario (solo OWNER)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(
    @CurrentUser() currentUser: { sub: string; tenantId: string; role: string },
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    await this.userUseCases.resetPassword(
      currentUser.tenantId,
      id,
      dto.password,
      currentUser.role as 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER',
      currentUser.sub,
    );
    return { message: 'Clave actualizada' };
  }

  @Delete(':id')
  @Roles('OWNER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar usuario del tenant (solo OWNER)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async remove(
    @CurrentUser() currentUser: { sub: string; tenantId: string; role: string },
    @Param('id') id: string,
  ) {
    await this.userUseCases.removeFromTenant(
      currentUser.tenantId,
      id,
      currentUser.role as 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER',
    );
    return { message: 'Usuario eliminado del tenant' };
  }

  @Post('invite')
  @Roles('OWNER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invitar usuario al tenant (solo OWNER)' })
  @ApiBody({ type: InviteUserDto })
  async invite(
    @CurrentUser() currentUser: { sub: string; tenantId: string; role: string },
    @Body() dto: InviteUserDto,
  ) {
    return this.userUseCases.invite(
      currentUser.tenantId,
      dto.email,
      dto.role ?? 'CASHIER',
      currentUser.role as 'OWNER' | 'ADMIN' | 'MANAGER' | 'CASHIER',
    );
  }
}
