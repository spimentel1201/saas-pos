import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service.js';

@Global()
@Module({
  providers: [
    {
      provide: 'LoggerService',
      useFactory: (): LoggerService => new LoggerService('app'),
    },
  ],
  exports: ['LoggerService'],
})
export class LoggerModule {}
