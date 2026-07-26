import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type {
  NotificationRepositoryPort,
  SendNotificationDto,
} from '../../application/ports/notification.repository.port.js';
import {
  Notification,
  NotificationStatus,
  NotificationType,
} from '../../domain/entities/notification.entity.js';

@Injectable()
export class InMemoryNotificationRepository implements NotificationRepositoryPort {
  private notifications: Map<string, Notification> = new Map();

  async send(dto: SendNotificationDto): Promise<Notification> {
    const notification = Notification.create({
      id: randomUUID(),
      tenantId: dto.tenantId,
      userId: dto.userId,
      type: dto.type,
      subject: dto.subject,
      body: dto.body,
      recipient: dto.recipient,
      metadata: dto.metadata,
    });

    notification.markAsSent();
    this.notifications.set(notification.id, notification);

    return notification;
  }

  async findById(id: string): Promise<Notification | null> {
    return this.notifications.get(id) || null;
  }

  async findByTenant(
    tenantId: string,
    filters?: {
      userId?: string;
      type?: NotificationType;
      status?: NotificationStatus;
    },
  ): Promise<Notification[]> {
    let results = Array.from(this.notifications.values()).filter((n) => n.tenantId === tenantId);

    if (filters?.userId) {
      results = results.filter((n) => n.userId === filters.userId);
    }

    if (filters?.type) {
      results = results.filter((n) => n.type === filters.type);
    }

    if (filters?.status) {
      results = results.filter((n) => n.status === filters.status);
    }

    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markAsRead(id: string): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.markAsRead();
    }
  }

  async delete(id: string): Promise<void> {
    this.notifications.delete(id);
  }
}
