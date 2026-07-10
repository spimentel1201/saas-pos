/**
 * tenants - gestion de comercios (multitenant root) + onboarding wizard.
 *
 * Endpoints:
 *   GET    /tenants/me                 perfil del tenant activo
 *   POST   /tenants/onboarding/branch   paso 1: crear primera sucursal
 *   POST   /tenants/onboarding/tax      paso 2: configurar primer impuesto
 *   POST   /tenants/onboarding/product  paso 3: crear primer producto
 *   GET    /tenants/branches            listar sucursales
 *   GET    /tenants/usage               contadores de uso del mes
 *
 * Todos estan scoped al tenant resuelto por @TenantRequired().
 */
export { TenantsModule } from './tenants.module.js';
