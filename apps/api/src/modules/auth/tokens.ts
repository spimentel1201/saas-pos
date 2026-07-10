/**
 * Injection tokens del modulo auth (interfaces en domain/, impls en infrastructure/).
 * Permite DI por interfaz (regla di-use-interfaces-tokens del skill nestjs-best-practices).
 */
export const USER_REPO = Symbol('USER_REPO');
export const PWD_HASHER = Symbol('PWD_HASHER');
export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');
export const TENANT_SCHEMA_CREATOR = Symbol('TENANT_SCHEMA_CREATOR');
