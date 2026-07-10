/**
 * PrismaModule - provee el PrismaClient compartido (base de datos global).
 *
 * Para queries dentro de un schema tenant inyectar `TenantPrismaService`,
 * que resuelve el search_path a partir de TenantContext.
 */
export { PrismaModule } from './prisma.module.js';
export { PrismaService } from './prisma.service.js';
export { TenantPrismaService } from './tenant-prisma.service.js';
