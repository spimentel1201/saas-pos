import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserUseCases } from './user.use-case.js';
import type { UserRepositoryPort } from '../ports/user.repository.port.js';
import type { TenantUserInfo } from '../../domain/entities/user-info.entity.js';
import type { Role } from '../../../auth/domain/entities/user.entity.js';

describe('UserUseCases', () => {
  let userUseCases: UserUseCases;
  let mockUserRepo: UserRepositoryPort;

  const mockTenantId = 'tenant_123';
  const mockUserId = 'user_456';

  beforeEach(() => {
    mockUserRepo = {
      listByTenant: vi.fn(),
      findByUserAndTenant: vi.fn(),
      updateRole: vi.fn(),
      removeFromTenant: vi.fn(),
      inviteToTenant: vi.fn(),
    };
    userUseCases = new UserUseCases(mockUserRepo);
  });

  describe('listTenantUsers', () => {
    it('returns list of users', async () => {
      const mockUsers: TenantUserInfo[] = [
        {
          userId: 'user_1',
          tenantId: mockTenantId,
          role: 'ADMIN',
          name: 'Admin User',
          email: 'admin@test.com',
          createdAt: new Date(),
        },
      ];

      vi.mocked(mockUserRepo.listByTenant).mockResolvedValue(mockUsers);

      const result = await userUseCases.listTenantUsers(mockTenantId);

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe('ADMIN');
    });
  });

  describe('getUserInTenant', () => {
    it('returns user if found', async () => {
      const mockUser: TenantUserInfo = {
        userId: mockUserId,
        tenantId: mockTenantId,
        role: 'CASHIER',
        name: 'Cashier User',
        email: 'cashier@test.com',
        createdAt: new Date(),
      };

      vi.mocked(mockUserRepo.findByUserAndTenant).mockResolvedValue(mockUser);

      const result = await userUseCases.getUserInTenant(mockUserId, mockTenantId);

      expect(result.userId).toBe(mockUserId);
    });

    it('throws NotFoundException if user not found', async () => {
      vi.mocked(mockUserRepo.findByUserAndTenant).mockResolvedValue(null);

      await expect(
        userUseCases.getUserInTenant(mockUserId, mockTenantId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateRole', () => {
    it('allows ADMIN to update CASHIER', async () => {
      const mockUser: TenantUserInfo = {
        userId: mockUserId,
        tenantId: mockTenantId,
        role: 'CASHIER',
        name: 'Cashier User',
        email: 'cashier@test.com',
        createdAt: new Date(),
      };

      vi.mocked(mockUserRepo.findByUserAndTenant).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepo.updateRole).mockResolvedValue({
        ...mockUser,
        role: 'MANAGER',
      });

      const result = await userUseCases.updateRole(
        mockTenantId,
        mockUserId,
        'MANAGER',
        'ADMIN',
      );

      expect(result.role).toBe('MANAGER');
    });

    it('throws ForbiddenException if trying to assign equal or higher role', async () => {
      await expect(
        userUseCases.updateRole(mockTenantId, mockUserId, 'ADMIN', 'ADMIN'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException if trying to update OWNER', async () => {
      const mockOwner: TenantUserInfo = {
        userId: mockUserId,
        tenantId: mockTenantId,
        role: 'OWNER',
        name: 'Owner User',
        email: 'owner@test.com',
        createdAt: new Date(),
      };

      vi.mocked(mockUserRepo.findByUserAndTenant).mockResolvedValue(mockOwner);

      await expect(
        userUseCases.updateRole(mockTenantId, mockUserId, 'ADMIN', 'OWNER'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException if user not found', async () => {
      vi.mocked(mockUserRepo.findByUserAndTenant).mockResolvedValue(null);

      await expect(
        userUseCases.updateRole(mockTenantId, mockUserId, 'CASHIER', 'ADMIN'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeFromTenant', () => {
    it('allows OWNER to remove CASHIER', async () => {
      const mockUser: TenantUserInfo = {
        userId: mockUserId,
        tenantId: mockTenantId,
        role: 'CASHIER',
        name: 'Cashier User',
        email: 'cashier@test.com',
        createdAt: new Date(),
      };

      vi.mocked(mockUserRepo.findByUserAndTenant).mockResolvedValue(mockUser);
      vi.mocked(mockUserRepo.removeFromTenant).mockResolvedValue();

      await userUseCases.removeFromTenant(mockTenantId, mockUserId, 'OWNER');

      expect(mockUserRepo.removeFromTenant).toHaveBeenCalledWith(
        mockUserId,
        mockTenantId,
      );
    });

    it('throws ForbiddenException if trying to remove OWNER', async () => {
      const mockOwner: TenantUserInfo = {
        userId: mockUserId,
        tenantId: mockTenantId,
        role: 'OWNER',
        name: 'Owner User',
        email: 'owner@test.com',
        createdAt: new Date(),
      };

      vi.mocked(mockUserRepo.findByUserAndTenant).mockResolvedValue(mockOwner);

      await expect(
        userUseCases.removeFromTenant(mockTenantId, mockUserId, 'ADMIN'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException if target has equal or higher role', async () => {
      const mockAdmin: TenantUserInfo = {
        userId: mockUserId,
        tenantId: mockTenantId,
        role: 'ADMIN',
        name: 'Admin User',
        email: 'admin@test.com',
        createdAt: new Date(),
      };

      vi.mocked(mockUserRepo.findByUserAndTenant).mockResolvedValue(mockAdmin);

      await expect(
        userUseCases.removeFromTenant(mockTenantId, mockUserId, 'ADMIN'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException if user not found', async () => {
      vi.mocked(mockUserRepo.findByUserAndTenant).mockResolvedValue(null);

      await expect(
        userUseCases.removeFromTenant(mockTenantId, mockUserId, 'OWNER'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('invite', () => {
    it('invites user with specified role', async () => {
      const mockInvited: TenantUserInfo = {
        userId: 'new_user',
        tenantId: mockTenantId,
        role: 'CASHIER',
        name: 'New User',
        email: 'new@test.com',
        createdAt: new Date(),
      };

      vi.mocked(mockUserRepo.inviteToTenant).mockResolvedValue(mockInvited);

      const result = await userUseCases.invite(
        mockTenantId,
        'new@test.com',
        'CASHIER',
      );

      expect(result.email).toBe('new@test.com');
      expect(result.role).toBe('CASHIER');
    });
  });
});
