import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { OnboardingService } from './application/services/onboarding.service.js';
import { TenantsController } from './infrastructure/http/tenants.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [TenantsController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class TenantsModule {}
