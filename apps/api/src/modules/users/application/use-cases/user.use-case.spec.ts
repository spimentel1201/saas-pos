import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PasswordHasherPort } from '../../../auth/domain/services/password-hasher.port.js';
import type { TenantUserInfo } from '../../domain/entities/user-info.entity.js';
import type { UserRepositoryPort } from '../ports/user.repository.port.js';
import { UserUseCases } from './user.use-case.js';

describe('UserUseCases', () => {
  let userUseCases: UserUseCases;
  let mockUserRepo: UserRepositoryPort;
  let mockHasher: PasswordHasherPort;

  const mockTenantId = 'tenant_123';
  const mockUserId = 'user_456';

  beforeEach(() => {
    mockUserRepo = {
      listByTenant: vi.fn(),
      findByUserAndTenant: vi.fn(),
      updateRole: vi.fn(),
      removeFromTenant: vi.fn(),
      inviteToTenant: vi.fn(),
      createUserInTenant: vi.fn(),
      updatePassword: vi.fn(),
    };
    mockHasher = {
      hash: vi.fn().mockResolvedValue('hashed-password'),
      compare: vi.fn().mockResolvedValue(true),
    };
    userUseCases = new UserUseCases(mockUserRepo, mockHasher);
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
      expect(result[0]?.role).toBe('ADMIN');
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

      await expect(userUseCases.getUserInTenant(mockUserId, mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
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

      const result = await userUseCases.updateRole(mockTenantId, mockUserId, 'MANAGER', 'ADMIN');

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

      expect(mockUserRepo.removeFromTenant).toHaveBeenCalledWith(mockUserId, mockTenantId);
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

      const result = await userUseCases.invite(mockTenantId, 'new@test.com', 'CASHIER', 'OWNER');

      expect(result.email).toBe('new@test.com');
      expect(result.role).toBe('CASHIER');
      expect(mockUserRepo.inviteToTenant).toHaveBeenCalledWith(
        mockTenantId,
        'new@test.com',
        'CASHIER',
      );
    });

    it('allows an ADMIN to invite a CASHIER', async () => {
      vi.mocked(mockUserRepo.inviteToTenant).mockResolvedValue({
        userId: 'new_user',
        tenantId: mockTenantId,
        role: 'CASHIER',
        name: 'New User',
        email: 'new@test.com',
        createdAt: new Date(),
      });

      const result = await userUseCases.invite(mockTenantId, 'new@test.com', 'CASHIER', 'ADMIN');

      expect(result.role).toBe('CASHIER');
    });

    it('throws ForbiddenException when inviting a role equal or higher than the actor', async () => {
      await expect(
        userUseCases.invite(mockTenantId, 'admin@test.com', 'ADMIN', 'ADMIN'),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        userUseCases.invite(mockTenantId, 'owner@test.com', 'OWNER', 'ADMIN'),
      ).rejects.toThrow(ForbiddenException);

      expect(mockUserRepo.inviteToTenant).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const createdUser: TenantUserInfo = {
      userId: 'new_user',
      tenantId: mockTenantId,
      role: 'CASHIER',
      name: 'Ana Torres',
      email: 'ana@test.com',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    it('generates and returns a temporary password when none is provided', async () => {
      vi.mocked(mockUserRepo.createUserInTenant).mockResolvedValue(createdUser);

      const result = await userUseCases.create(
        mockTenantId,
        { name: 'Ana Torres', email: 'ana@test.com' },
        'OWNER',
      );

      expect(result.temporaryPassword).toMatch(/^[A-Za-z0-9]{10}$/);
      expect(mockHasher.hash).toHaveBeenCalledWith(result.temporaryPassword);
      expect(mockUserRepo.createUserInTenant).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockTenantId,
          role: 'CASHIER',
          passwordHash: 'hashed-password',
        }),
      );
    });

    it('does not leak the password back when the owner typed one', async () => {
      vi.mocked(mockUserRepo.createUserInTenant).mockResolvedValue(createdUser);

      const result = await userUseCases.create(
        mockTenantId,
        { name: 'Ana Torres', email: 'ana@test.com', password: 'clavefija123' },
        'OWNER',
      );

      expect(result.temporaryPassword).toBeUndefined();
      expect(mockHasher.hash).toHaveBeenCalledWith('clavefija123');
    });

    it('throws ForbiddenException when creating a role equal or higher than the actor', async () => {
      await expect(
        userUseCases.create(
          mockTenantId,
          { name: 'Otro', email: 'otro@test.com', role: 'OWNER' },
          'ADMIN',
        ),
      ).rejects.toThrow(ForbiddenException);

      expect(mockUserRepo.createUserInTenant).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const cashier: TenantUserInfo = {
      userId: mockUserId,
      tenantId: mockTenantId,
      role: 'CASHIER',
      name: 'Cashier User',
      email: 'cashier@test.com',
      createdAt: new Date(),
    };

    it('hashes and stores the new password', async () => {
      vi.mocked(mockUserRepo.findByUserAndTenant).mockResolvedValue(cashier);

      await userUseCases.resetPassword(
        mockTenantId,
        mockUserId,
        'nuevaclave123',
        'OWNER',
        'owner_id',
      );

      expect(mockHasher.hash).toHaveBeenCalledWith('nuevaclave123');
      expect(mockUserRepo.updatePassword).toHaveBeenCalledWith(mockUserId, 'hashed-password');
    });

    it('throws ForbiddenException when the target has an equal or higher role', async () => {
      vi.mocked(mockUserRepo.findByUserAndTenant).mockResolvedValue({
        ...cashier,
        role: 'ADMIN',
      });

      await expect(
        userUseCases.resetPassword(mockTenantId, mockUserId, 'nuevaclave123', 'ADMIN', 'other_id'),
      ).rejects.toThrow(ForbiddenException);

      expect(mockUserRepo.updatePassword).not.toHaveBeenCalled();
    });

    it('allows resetting your own password regardless of hierarchy', async () => {
      vi.mocked(mockUserRepo.findByUserAndTenant).mockResolvedValue({
        ...cashier,
        role: 'OWNER',
      });

      await userUseCases.resetPassword(
        mockTenantId,
        mockUserId,
        'nuevaclave123',
        'OWNER',
        mockUserId,
      );

      expect(mockUserRepo.updatePassword).toHaveBeenCalledWith(mockUserId, 'hashed-password');
    });

    it('throws NotFoundException if the user is not in the tenant', async () => {
      vi.mocked(mockUserRepo.findByUserAndTenant).mockResolvedValue(null);

      await expect(
        userUseCases.resetPassword(mockTenantId, mockUserId, 'nuevaclave123', 'OWNER', 'owner_id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
