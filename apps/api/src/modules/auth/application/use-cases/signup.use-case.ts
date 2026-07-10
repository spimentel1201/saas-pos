import { Inject, Injectable } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service.js';
import {
  EmailAlreadyRegisteredError,
  TenantSlugTakenError,
} from '../../domain/errors/auth-errors.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import type { PasswordHasherPort } from '../../domain/services/password-hasher.port.js';
import { PWD_HASHER, TENANT_SCHEMA_CREATOR, TOKEN_SERVICE, USER_REPO } from '../../tokens.js';
import type { AuthTokensDto } from '../dtos/auth-output.dto.js';
import type { SignupDto } from '../dtos/auth.dto.js';
import type { TenantSchemaCreatorPort } from '../ports/tenant-schema-creator.port.js';
import type { TokenServicePort } from '../ports/token-service.port.js';

type PrismaTransaction = Omit<
  PrismaClient,
  '$on' | '$connect' | '$disconnect' | '$use' | '$transaction' | '$extends'
>;

/**
 * Signup - alta de un nuevo comercio (tenant) + primer usuario owner.
 * Transaccion atomica sobre la base compartida:
 *   1. Validar que email y slug no existan.
 *   2. Hash password (bcrypt).
 *   3. Crear Tenant (con schemaName derivado del slug) + User + TenantUser(role=OWNER).
 *   4. Crear Subscription (status=TRIALING, 14 dias).
 *   5. Crear el schema PostgreSQL del tenant (asincrono via TenantSchemaCreator).
 *
 * Nota: la creacion del schema puede fallar en caliente; en ese caso el tenant
 * queda marcado como PAUSED. La API no revierte el alta — se reintenta via job.
 */
@Injectable()
export class SignupUseCase {
  constructor(
    @Inject(USER_REPO) private readonly users: UserRepository,
    @Inject(PWD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort,
    @Inject(TENANT_SCHEMA_CREATOR) private readonly schemaCreator: TenantSchemaCreatorPort,
    private readonly prisma: PrismaService,
  ) {}

  async execute(dto: SignupDto): Promise<AuthTokensDto & { tenantId: string }> {
    const email = dto.ownerEmail.toLowerCase().trim();
    const slug = dto.slug.toLowerCase();

    // 1. Validaciones de unicidad
    const existingUser = await this.users.findByEmail(email);
    if (existingUser) {
      throw new EmailAlreadyRegisteredError(email);
    }
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existingTenant) {
      throw new TenantSlugTakenError(slug);
    }

    // 2. Hash password
    const passwordHash = await this.hasher.hash(dto.password);

    // 3 y 4. Crear tenant + user + rol + subscription en una transaccion
    const tenantId = ulid();
    const userId = ulid();
    const schemaName = `tenant_${snakeCase(slug)}_${tenantId.slice(-6).toLowerCase()}`;
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);

    const { user } = await this.prisma.$transaction(async (tx: PrismaTransaction) => {
      const tenant = await tx.tenant.create({
        data: {
          id: tenantId,
          name: dto.businessName,
          slug,
          schemaName,
          plan: 'STARTER',
          status: 'TRIALING',
        },
      });
      const newUser = await tx.user.create({
        data: {
          id: userId,
          email,
          name: dto.ownerName,
          passwordHash,
        },
      });
      await tx.tenantUser.create({
        data: { userId, tenantId, role: 'OWNER' },
      });
      await tx.subscription.create({
        data: {
          tenantId,
          status: 'TRIALING',
          currentPeriodEnd: trialEnd,
        },
      });
      return { tenant, user: newUser };
    });

    // 5. Creacion del schema tenant (fuera de la tx de la base compartida).
    // En caliente: si falla, el tenant queda TRIALING y se reintenta via worker.
    try {
      await this.schemaCreator.create(schemaName);
    } catch (err) {
      // Logger. El tenant ya existe; el worker `tenants.create-schema` reintenta.
      console.error('Fallo creacion de schema', schemaName, err);
    }

    // 6. Generar tokens
    const accessToken = this.tokens.signAccessToken({
      sub: user.id,
      email: user.email,
      tenantId,
      role: 'OWNER',
    });
    const refreshToken = this.tokens.signRefreshToken({
      sub: user.id,
      email: user.email,
      tokenId: ulid(),
    });

    return {
      accessToken,
      refreshToken,
      userId: user.id,
      primaryRole: 'OWNER',
      tenantSlug: slug,
      tenantId,
    };
  }
}

function snakeCase(s: string): string {
  return s.replace(/-/g, '_').replace(/[^a-z0-9_]/g, '');
}
