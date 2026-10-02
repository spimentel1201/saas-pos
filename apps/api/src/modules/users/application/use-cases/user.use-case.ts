import { randomInt } from 'node:crypto';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Role } from '../../../auth/domain/entities/user.entity.js';
import type { PasswordHasherPort } from '../../../auth/domain/services/password-hasher.port.js';
import { PWD_HASHER } from '../../../auth/tokens.js';
import type { TenantUserInfo, UserListItemDTO } from '../../domain/entities/user-info.entity.js';
import { USER_REPO } from '../../users.tokens.js';
import type { UserRepositoryPort } from '../ports/user.repository.port.js';

const ROLE_HIERARCHY: Record<Role, number> = {
  OWNER: 3,
  ADMIN: 2,
  MANAGER: 1,
  CASHIER: 0,
};

/** Sin caracteres ambiguos (0/O, 1/l/I) para que la clave temporal se pueda dictar. */
const PASSWORD_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
const TEMP_PASSWORD_LENGTH = 10;

function generateTemporaryPassword(): string {
  let password = '';
  for (let i = 0; i < TEMP_PASSWORD_LENGTH; i += 1) {
    password += PASSWORD_ALPHABET[randomInt(PASSWORD_ALPHABET.length)];
  }
  return password;
}

export interface CreateUserInput {
  name: string;
  email: string;
  role?: Role;
  password?: string;
}

export type CreateUserResult = TenantUserInfo & { temporaryPassword?: string };

@Injectable()
export class UserUseCases {
  constructor(
    @Inject(USER_REPO) private readonly userRepo: UserRepositoryPort,
    @Inject(PWD_HASHER) private readonly hasher: PasswordHasherPort,
  ) {}

  private assertCanManage(actorRole: Role, targetRole: Role): void {
    if (ROLE_HIERARCHY[actorRole] <= ROLE_HIERARCHY[targetRole]) {
      throw new ForbiddenException(
        'No puedes gestionar usuarios con un rol igual o superior al tuyo',
      );
    }
  }

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

  async create(tenantId: string, dto: CreateUserInput, actorRole: Role): Promise<CreateUserResult> {
    const role = dto.role ?? 'CASHIER';
    this.assertCanManage(actorRole, role);

    const wasProvided = Boolean(dto.password);
    const plainPassword = dto.password ?? generateTemporaryPassword();
    const passwordHash = await this.hasher.hash(plainPassword);

    const created = await this.userRepo.createUserInTenant({
      tenantId,
      name: dto.name,
      email: dto.email,
      role,
      passwordHash,
    });

    return wasProvided ? created : { ...created, temporaryPassword: plainPassword };
  }

  async resetPassword(
    tenantId: string,
    userId: string,
    newPassword: string,
    actorRole: Role,
    actorId: string,
  ): Promise<void> {
    const target = await this.userRepo.findByUserAndTenant(userId, tenantId);
    if (!target) throw new NotFoundException('Usuario no encontrado en este tenant');
    if (userId !== actorId) this.assertCanManage(actorRole, target.role);

    const passwordHash = await this.hasher.hash(newPassword);
    await this.userRepo.updatePassword(userId, passwordHash);
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

  async invite(
    tenantId: string,
    email: string,
    role: Role,
    actorRole: Role,
  ): Promise<UserListItemDTO> {
    const targetRole = role ?? 'CASHIER';
    this.assertCanManage(actorRole, targetRole);
    return this.userRepo.inviteToTenant(tenantId, email, targetRole);
  }
}
