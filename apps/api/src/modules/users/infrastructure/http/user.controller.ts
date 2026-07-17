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
import { InviteUserDto, UpdateUserRoleDto } from '../../application/dto/user.dto.js';
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
  @ApiOperation({ summary: 'Listar usuarios del tenant' })
  async list(@CurrentUser() user: { sub: string; tenantId: string }) {
    return this.userUseCases.listTenantUsers(user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener usuario del tenant' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async getById(
    @CurrentUser() currentUser: { sub: string; tenantId: string },
    @Param('id') id: string,
  ) {
    return this.userUseCases.getUserInTenant(id, currentUser.tenantId);
  }

  @Patch(':id/role')
  @Roles('OWNER', 'ADMIN')
  @ApiOperation({ summary: 'Cambiar rol de usuario (solo OWNER/ADMIN)' })
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

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar usuario del tenant (solo OWNER/ADMIN)' })
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
  @Roles('OWNER', 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Invitar usuario al tenant (solo OWNER/ADMIN)' })
  @ApiBody({ type: InviteUserDto })
  async invite(
    @CurrentUser() currentUser: { sub: string; tenantId: string },
    @Body() dto: InviteUserDto,
  ) {
    return this.userUseCases.invite(currentUser.tenantId, dto.email, dto.role ?? 'CASHIER');
  }
}
