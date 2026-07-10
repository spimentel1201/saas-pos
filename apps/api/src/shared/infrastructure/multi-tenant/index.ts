/**
 * Multi-tenant: resolucion de tenant por request.
 *
 *  TenantContext (AsyncLocalStorage) - mantiene el tenant activo durante el request.
 *  TenantResolverMiddleware - detecta subdomain o header X-Tenant, lo busca en
 *    `tenants` y carga schemaName -> TenantContext.
 *  TenantGuard - deniega 404 si no hay tenant cuando el endpoint es tenant-scoped.
 *
 *  Ver seccion 4.5 del plan (Multi-tenant -> Prisma extension + search_path).
 */
export { TenantContext } from './tenant-context.js';
export { TenantContextModule } from './tenant-context.module.js';
export { TenantResolverMiddleware } from './tenant-resolver.middleware.js';
export { TenantGuard } from './tenant.guard.js';
