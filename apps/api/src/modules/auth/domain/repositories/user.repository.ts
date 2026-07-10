import type { User } from '../entities/user.entity.js';

/**
 * Puerto del repositorio de usuarios.
 * La implementacion vive en infrastructure/repositories/ (Prisma).
 * El application/ solo conoce esta interfaz.
 */
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  updateLastLogin(id: string, at: Date): Promise<void>;
  verifyEmail(id: string): Promise<void>;
  savePasswordHash(id: string, passwordHash: string): Promise<void>;
}
