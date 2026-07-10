import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BillingService } from './application/services/billing.service.js';
import { BillingController } from './infrastructure/http/billing.controller.js';
import { rawBodyMiddleware } from './raw-body.middleware.js';

@Module({
  imports: [AuthModule],
  controllers: [BillingController],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // El webhook necesita el raw buffer sin validacion para verificar la firma.
    consumer.apply(rawBodyMiddleware).forRoutes('api/v1/billing/webhook');
  }
}
