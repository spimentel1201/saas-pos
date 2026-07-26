import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Notification, NotificationType } from '../../domain/entities/notification.entity.js';
import {
  NotificationNotFoundError,
  NotificationSendError,
} from '../../domain/errors/notification.errors.js';
import { NOTIFICATION_REPOSITORY } from '../../notifications.tokens.js';
import type { NotificationRepositoryPort } from '../ports/notification.repository.port.js';

export interface SendNotificationRequest {
  tenantId: string;
  userId?: string;
  type: NotificationType;
  subject: string;
  body: string;
  recipient: string;
  metadata?: Record<string, unknown>;
}

export interface SendEmailRequest {
  tenantId: string;
  userId?: string;
  to: string;
  subject: string;
  html: string;
  metadata?: Record<string, unknown>;
}

export interface SendSMSRequest {
  tenantId: string;
  userId?: string;
  to: string;
  message: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationUseCases {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly notificationRepository: NotificationRepositoryPort,
  ) {}

  async sendNotification(request: SendNotificationRequest): Promise<Notification> {
    try {
      const _notification = Notification.create({
        id: randomUUID(),
        tenantId: request.tenantId,
        userId: request.userId,
        type: request.type,
        subject: request.subject,
        body: request.body,
        recipient: request.recipient,
        metadata: request.metadata,
      });

      const sentNotification = await this.notificationRepository.send({
        tenantId: request.tenantId,
        userId: request.userId,
        type: request.type,
        subject: request.subject,
        body: request.body,
        recipient: request.recipient,
        metadata: request.metadata,
      });

      return sentNotification;
    } catch (error) {
      if (error instanceof NotificationSendError) {
        throw error;
      }
      throw new NotificationSendError(
        `Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async sendEmail(request: SendEmailRequest): Promise<Notification> {
    return this.sendNotification({
      tenantId: request.tenantId,
      userId: request.userId,
      type: NotificationType.EMAIL,
      subject: request.subject,
      body: request.html,
      recipient: request.to,
      metadata: request.metadata,
    });
  }

  async sendSMS(request: SendSMSRequest): Promise<Notification> {
    return this.sendNotification({
      tenantId: request.tenantId,
      userId: request.userId,
      type: NotificationType.SMS,
      subject: 'SMS',
      body: request.message,
      recipient: request.to,
      metadata: request.metadata,
    });
  }

  async sendPushNotification(
    tenantId: string,
    userId: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<Notification> {
    return this.sendNotification({
      tenantId,
      userId,
      type: NotificationType.PUSH,
      subject: title,
      body,
      recipient: userId,
      metadata: data,
    });
  }

  async sendSaleConfirmation(
    tenantId: string,
    userId: string,
    saleId: string,
    total: number,
  ): Promise<Notification> {
    return this.sendEmail({
      tenantId,
      userId,
      to: userId,
      subject: `Sale Confirmation - ${saleId}`,
      html: `
        <h2>Sale Confirmation</h2>
        <p>Your sale has been completed successfully.</p>
        <p><strong>Sale ID:</strong> ${saleId}</p>
        <p><strong>Total:</strong> S/ ${total.toFixed(2)}</p>
        <p>Thank you for your purchase!</p>
      `,
      metadata: { saleId, total },
    });
  }

  async sendLowStockAlert(
    tenantId: string,
    productId: string,
    productName: string,
    currentStock: number,
    minStock: number,
  ): Promise<Notification> {
    return this.sendEmail({
      tenantId,
      to: 'admin',
      subject: `Low Stock Alert - ${productName}`,
      html: `
        <h2>Low Stock Alert</h2>
        <p>The product <strong>${productName}</strong> is running low on stock.</p>
        <p><strong>Current Stock:</strong> ${currentStock}</p>
        <p><strong>Minimum Stock:</strong> ${minStock}</p>
        <p>Please restock soon.</p>
      `,
      metadata: { productId, currentStock, minStock },
    });
  }

  async getNotificationById(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotificationNotFoundError(id);
    }
    return notification;
  }

  async getTenantNotifications(
    tenantId: string,
    filters?: {
      userId?: string;
      type?: NotificationType;
    },
  ): Promise<Notification[]> {
    return this.notificationRepository.findByTenant(tenantId, filters);
  }

  async markAsRead(id: string): Promise<void> {
    await this.notificationRepository.markAsRead(id);
  }
}
