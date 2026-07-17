import type { Role } from '../../../auth/domain/entities/user.entity.js';

export interface TenantUserInfo {
  userId: string;
  tenantId: string;
  role: Role;
  name: string;
  email: string;
  createdAt: Date;
}

export interface UserListItemDTO {
  userId: string;
  tenantId: string;
  role: Role;
  name: string;
  email: string;
  createdAt: Date;
}
