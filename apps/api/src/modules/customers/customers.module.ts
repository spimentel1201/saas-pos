import { Module } from '@nestjs/common';

/**
 * CustomersModule - modulo de dominio.
 *
 * Estructura DDD-lite (ver PLAN-MVP-POS-SAAS.md seccion 4.2):
 *   domain/         entidades, value objects, reglas puras
 *   application/    casos de uso, servicios, DTOs
 *   infrastructure/ controllers, repos Prisma, eventos, adaptadores
 */
@Module({
  imports: [],
  controllers: [],
  providers: [],
  exports: [],
})
export class CustomersModule {}
