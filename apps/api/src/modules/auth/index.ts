/**
 * auth - autenticacion y onboarding de usuarios globales.
 *
 * Endpoints:
 *   POST /auth/signup                 alta tenant + primer usuario (owner).
 *   POST /auth/login                  login con email/password.
 *   POST /auth/refresh                intercambia refresh token por access.
 *   POST /auth/logout                 invalida refresh.
 *   GET  /auth/me                     perfil del usuario autenticado.
 *
 * Ver PLAN-MVP-POS-SAAS.md seccion 6 (modulo A).
 */
export { AuthModule } from './auth.module.js';
