import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'is-public';

/**
 * Marca un endpoint (o controller) como publico: no requiere JWT.
 * Combina con el APP_GUARD JwtAuthGuard que chequea esta metadata
 * y hace bypass si esta presente.
 */
export const Public = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);
