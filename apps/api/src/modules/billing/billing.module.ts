import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { BillingUseCases } from './application/use-cases/billing.use-case.js';
import { BILLING_REPO } from './billing.tokens.js';
import { BillingController } from './infrastructure/http/billing.controller.js';
import { PrismaBillingRepository } from './infrastructure/repositories/prisma-billing.repository.js';
import { rawBodyMiddleware } from './raw-body.middleware.js';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [BillingController],
  providers: [BillingUseCases, { provide: BILLING_REPO, useClass: PrismaBillingRepository }],
  exports: [BillingUseCases],
})
export class BillingModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(rawBodyMiddleware).forRoutes('api/v1/billing/webhook');
  }
}
