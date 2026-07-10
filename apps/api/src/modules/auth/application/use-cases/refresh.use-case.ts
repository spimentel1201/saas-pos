import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { TOKEN_SERVICE } from '../../tokens.js';
import type { RefreshDto } from '../dtos/auth.dto.js';
import type { TokenServicePort } from '../ports/token-service.port.js';

/**
 * Refresh - intercambia un refresh token valido por un nuevo access token.
 *
 * El refresh es JWT self-contained (sin tabla de sesiones). Rotate es opcional
 * para el MVP; en v2 se persistiran `refresh_token_id` en tabla para revocacion.
 */
@Injectable()
export class RefreshUseCase {
  constructor(@Inject(TOKEN_SERVICE) private readonly tokens: TokenServicePort) {}

  execute(dto: RefreshDto): { accessToken: string } {
    let payload: { sub: string; email: string; tokenId: string };
    try {
      payload = this.tokens.verifyRefreshToken(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Refresh token invalido');
    }

    const accessToken = this.tokens.signAccessToken({
      sub: payload.sub,
      email: payload.email,
    });
    return { accessToken };
  }
}
