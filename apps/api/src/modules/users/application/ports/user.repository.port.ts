import type { Role } from '../../../auth/domain/entities/user.entity.js';
import type { TenantUserInfo } from '../../domain/entities/user-info.entity.js';

export interface CreateUserParams {
  tenantId: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
}

export interface UserRepositoryPort {
  listByTenant(tenantId: string): Promise<TenantUserInfo[]>;
  findByUserAndTenant(userId: string, tenantId: string): Promise<TenantUserInfo | null>;
  updateRole(userId: string, tenantId: string, role: Role): Promise<TenantUserInfo>;
  removeFromTenant(userId: string, tenantId: string): Promise<void>;
  inviteToTenant(tenantId: string, email: string, role: Role): Promise<TenantUserInfo>;
  createUserInTenant(params: CreateUserParams): Promise<TenantUserInfo>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
}
