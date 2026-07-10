import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId?: string;
  role?: string;
}

/**
 * JwtStrategy - extrae el access token del header Authorization: Bearer ...
 * y lo valida contra JWT_ACCESS_SECRET. Pone el payload en `req.user`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(jwt: JwtService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
      passReqToCallback: false,
    });
    void jwt;
  }

  validate(payload: JwtPayload): JwtPayload {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Token invalido');
    }
    return payload;
  }
}
