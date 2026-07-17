import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Role } from '../../../auth/domain/entities/user.entity.js';
import type { UserListItemDTO } from '../../domain/entities/user-info.entity.js';
import { USER_REPO } from '../../users.tokens.js';
import type { UserRepositoryPort } from '../ports/user.repository.port.js';

const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 3,
  ADMIN: 2,
  MANAGER: 1,
  CASHIER: 0,
};

@Injectable()
export class UserUseCases {
  constructor(@Inject(USER_REPO) private readonly userRepo: UserRepositoryPort) {}

  async listTenantUsers(tenantId: string): Promise<UserListItemDTO[]> {
    const users = await this.userRepo.listByTenant(tenantId);
    return users.map((u) => ({
      userId: u.userId,
      tenantId: u.tenantId,
      role: u.role,
      name: u.name,
      email: u.email,
      createdAt: u.createdAt,
    }));
  }

  async getUserInTenant(userId: string, tenantId: string): Promise<UserListItemDTO> {
    const user = await this.userRepo.findByUserAndTenant(userId, tenantId);
    if (!user) throw new NotFoundException('Usuario no encontrado en este tenant');
    return {
      userId: user.userId,
      tenantId: user.tenantId,
      role: user.role,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    };
  }

  async updateRole(
    tenantId: string,
    targetUserId: string,
    newRole: Role,
    currentUserRole: Role,
  ): Promise<UserListItemDTO> {
    const currentLevel = ROLE_HIERARCHY[currentUserRole] ?? 0;
    const newLevel = ROLE_HIERARCHY[newRole] ?? 0;

    if (newLevel >= currentLevel) {
      throw new ForbiddenException('No puedes asignar un rol igual o superior al tuyo');
    }

    const existing = await this.userRepo.findByUserAndTenant(targetUserId, tenantId);
    if (!existing) throw new NotFoundException('Usuario no encontrado en este tenant');

    if (existing.role === 'OWNER') {
      throw new ForbiddenException('No puedes cambiar el rol del propietario');
    }

    return this.userRepo.updateRole(targetUserId, tenantId, newRole);
  }

  async removeFromTenant(
    tenantId: string,
    targetUserId: string,
    currentUserRole: Role,
  ): Promise<void> {
    const existing = await this.userRepo.findByUserAndTenant(targetUserId, tenantId);
    if (!existing) throw new NotFoundException('Usuario no encontrado en este tenant');

    if (existing.role === 'OWNER') {
      throw new ForbiddenException('No puedes eliminar al propietario');
    }

    const currentLevel = ROLE_HIERARCHY[currentUserRole] ?? 0;
    const targetLevel = ROLE_HIERARCHY[existing.role] ?? 0;

    if (targetLevel >= currentLevel) {
      throw new ForbiddenException(
        'No puedes eliminar un usuario con rol igual o superior al tuyo',
      );
    }

    await this.userRepo.removeFromTenant(targetUserId, tenantId);
  }

  async invite(tenantId: string, email: string, role: Role): Promise<UserListItemDTO> {
    return this.userRepo.inviteToTenant(tenantId, email, role ?? 'CASHIER');
  }
}
