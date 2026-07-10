import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';

export const TENANT_REQUIRED_KEY = 'tenant-required';

/**
 * Marca un endpoint (o controller) como dependiente de un tenant resuelto
 * en el contexto. Combina con TenantGuard y avisa a Swagger que envíe el header X-Tenant-Slug.
 */
export const TenantRequired = () =>
  applyDecorators(
    SetMetadata(TENANT_REQUIRED_KEY, true),
    ApiSecurity('tenant-slug')
  );
