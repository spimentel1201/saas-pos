import { Module } from '@nestjs/common';
import { NotificationUseCases } from './application/use-cases/notification.use-case.js';
import { NotificationController } from './infrastructure/http/notification.controller.js';
import { InMemoryNotificationRepository } from './infrastructure/repositories/in-memory-notification.repository.js';
import { NOTIFICATION_REPOSITORY } from './notifications.tokens.js';

@Module({
  controllers: [NotificationController],
  providers: [
    NotificationUseCases,
    {
      provide: NOTIFICATION_REPOSITORY,
      useClass: InMemoryNotificationRepository,
    },
  ],
  exports: [NotificationUseCases],
})
export class NotificationsModule {}
