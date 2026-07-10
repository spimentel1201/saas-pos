import { Global, type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { TenantContext } from './tenant-context.js';
import { TenantResolverMiddleware } from './tenant-resolver.middleware.js';

@Global()
@Module({
  providers: [TenantContext],
  exports: [TenantContext],
})
export class TenantContextModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantResolverMiddleware).forRoutes('*');
  }
}
