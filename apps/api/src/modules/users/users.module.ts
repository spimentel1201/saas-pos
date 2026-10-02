import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UserUseCases } from './application/use-cases/user.use-case.js';
import { RolesGuard } from './domain/guards/roles.guard.js';
import { UserController } from './infrastructure/http/user.controller.js';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository.js';
import { USER_REPO } from './users.tokens.js';

@Module({
  imports: [AuthModule],
  controllers: [UserController],
  providers: [UserUseCases, RolesGuard, { provide: USER_REPO, useClass: PrismaUserRepository }],
  exports: [UserUseCases, RolesGuard],
})
export class UsersModule {}
