import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type { TokenServicePort } from '../../application/ports/token-service.port.js';

interface AccessTokenPayload {
  sub: string;
  email: string;
  tenantId?: string;
  role?: string;
}

interface RefreshTokenPayload {
  sub: string;
  email: string;
  tokenId: string;
}

/**
 * JwtTokenService - impl del puerto TokenServicePort sobre @nestjs/jwt.
 * Emite access (corto, 15m) y refresh (largo, 7d) firmados con secretos distintos.
 */
@Injectable()
export class JwtTokenService implements TokenServicePort {
  constructor(private readonly jwt: JwtService) {}

  private get accessSecret(): string {
    return process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me';
  }

  private get refreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me';
  }

  signAccessToken(payload: AccessTokenPayload): string {
    const opts: JwtSignOptions = {
      secret: this.accessSecret,
      expiresIn: (process.env.JWT_ACCESS_TTL ?? '15m') as unknown as JwtSignOptions['expiresIn'],
    };
    return this.jwt.sign(payload, opts);
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return this.jwt.verify<AccessTokenPayload>(token, { secret: this.accessSecret });
    } catch {
      throw new UnauthorizedException('Access token invalido');
    }
  }

  signRefreshToken(payload: RefreshTokenPayload): string {
    const opts: JwtSignOptions = {
      secret: this.refreshSecret,
      expiresIn: (process.env.JWT_REFRESH_TTL ?? '7d') as unknown as JwtSignOptions['expiresIn'],
    };
    return this.jwt.sign(payload, opts);
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return this.jwt.verify<RefreshTokenPayload>(token, { secret: this.refreshSecret });
    } catch {
      throw new UnauthorizedException('Refresh token invalido');
    }
  }
}
