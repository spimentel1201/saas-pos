import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service.js';
import { User } from '../../domain/entities/user.entity.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';

/**
 * PrismaUserRepository - impl del puerto UserRepository sobre Prisma.
 * PERTENECE a infrastructure/ — application/ solo ve la interfaz.
 */
@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(user: User): Promise<User> {
    const row = await this.prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash: user.passwordHash,
      },
    });
    return this.toDomain(row);
  }

  async updateLastLogin(id: string, at: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: at },
    });
  }

  async verifyEmail(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { emailVerified: new Date() },
    });
  }

  async savePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  private toDomain(row: {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    emailVerified: Date | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return User.rehydrate(row);
  }
}
