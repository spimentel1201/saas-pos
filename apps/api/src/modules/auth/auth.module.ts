import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LoginUseCase } from './application/use-cases/login.use-case.js';
import { RefreshUseCase } from './application/use-cases/refresh.use-case.js';
import { SignupUseCase } from './application/use-cases/signup.use-case.js';
import { AuthController } from './infrastructure/http/auth.controller.js';
import { JwtStrategy } from './infrastructure/http/jwt.strategy.js';
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository.js';
import { BcryptPasswordHasher } from './infrastructure/services/bcrypt-hasher.service.js';
import { JwtTokenService } from './infrastructure/services/jwt-token.service.js';
import { SqlTenantSchemaCreator } from './infrastructure/services/sql-tenant-schema-creator.js';
import { PWD_HASHER, TENANT_SCHEMA_CREATOR, TOKEN_SERVICE, USER_REPO } from './tokens.js';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' }), JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    JwtStrategy,
    SignupUseCase,
    LoginUseCase,
    RefreshUseCase,
    { provide: USER_REPO, useClass: PrismaUserRepository },
    { provide: PWD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: TENANT_SCHEMA_CREATOR, useClass: SqlTenantSchemaCreator },
  ],
  exports: [PassportModule, JwtModule, TOKEN_SERVICE],
})
export class AuthModule {}
