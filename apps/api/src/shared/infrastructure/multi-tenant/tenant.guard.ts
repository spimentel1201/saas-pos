import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantContext } from './tenant-context.js';
import { TENANT_REQUIRED_KEY } from './tenant-required.decorator.js';

/**
 * TenantGuard - aplica a rutas marcadas con `@TenantRequired()`.
 * Lanza 404 (no 403) cuando un tenant no existe, para no revelar existencia.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly ctx: TenantContext,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<boolean>(TENANT_REQUIRED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required) {
      return true;
    }

    const info = TenantContext.current;
    if (!info) {
      throw new NotFoundException();
    }
    return true;
  }
}
