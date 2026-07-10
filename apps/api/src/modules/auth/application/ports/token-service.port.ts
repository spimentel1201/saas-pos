/**
 * Puerto del servicio de tokens JWT. Encapsula signing + verification.
 * Permite testear sin @nestjs/jwt y migrar a otra lib en un solo punto.
 */
export interface TokenServicePort {
  signAccessToken(payload: {
    sub: string;
    email: string;
    tenantId?: string;
    role?: string;
  }): string;

  signRefreshToken(payload: {
    sub: string;
    email: string;
    tokenId: string;
  }): string;

  verifyAccessToken(token: string): {
    sub: string;
    email: string;
    tenantId?: string;
    role?: string;
  };

  verifyRefreshToken(token: string): {
    sub: string;
    email: string;
    tokenId: string;
  };
}
