import {
  type Notification,
  NotificationStatus,
  NotificationType,
} from '../../domain/entities/notification.entity.js';

export interface SendNotificationDto {
  tenantId: string;
  userId?: string;
  type: NotificationType;
  subject: string;
  body: string;
  recipient: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationRepositoryPort {
  send(notification: SendNotificationDto): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  findByTenant(
    tenantId: string,
    filters?: {
      userId?: string;
      type?: NotificationType;
      status?: NotificationStatus;
    },
  ): Promise<Notification[]>;
  markAsRead(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
