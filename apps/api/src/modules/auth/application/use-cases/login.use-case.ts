import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ulid } from 'ulid';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service.js';
import type { UserRepository } from '../../domain/repositories/user.repository.js';
import type { PasswordHasherPort } from '../../domain/services/password-hasher.port.js';
import { PWD_HASHER, TOKEN_SERVICE, USER_REPO } from '../../tokens.js';
import type { AuthTokensDto } from '../dtos/auth-output.dto.js';
import type { LoginDto } from '../dtos/auth.dto.js';
import type { TokenServicePort } from '../ports/token-service.port.js';

/**
 * Login - valida credenciales y emite par access+refresh.
 *
 * NO resuelve tenant aqui: el usuario puede pertenecer a varios tenants.
 * El frontend le pregunta al endpoint /auth/me la lista y eligue uno.
 */
@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPO) private readonly users: UserRepository,
    @Inject(PWD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    dto: LoginDto,
  ): Promise<AuthTokensDto & { tenants: Array<{ slug: string; role: string; name: string }> }> {
    const user = await this.users.findByEmail(dto.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedException('Credenciales invalidas');
    }
    const ok = await this.hasher.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    await this.users.updateLastLogin(user.id, new Date());

    const memberships = await this.prisma.tenantUser.findMany({
      where: { userId: user.id },
      select: {
        role: true,
        tenant: { select: { id: true, slug: true, name: true } },
      },
    });

    const primary = memberships[0];
    const accessToken = this.tokens.signAccessToken({
      sub: user.id,
      email: user.email,
      tenantId: primary?.tenant?.id,
      role: primary?.role,
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
      primaryRole: primary?.role ?? 'CASHIER',
      tenantSlug: primary?.tenant?.slug ?? '',
      tenants: memberships.map((m: (typeof memberships)[number]) => ({
        slug: m.tenant.slug,
        role: m.role,
        name: m.tenant.name,
      })),
    };
  }
}
