import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentTenant } from '../../../../shared/infrastructure/http/current-tenant.decorator.js';
import { TenantRequired } from '../../../../shared/infrastructure/multi-tenant/tenant-required.decorator.js';
import { NotificationUseCases } from '../../application/use-cases/notification.use-case.js';
import { NotificationType } from '../../domain/entities/notification.entity.js';

@Controller('api/v1/notifications')
export class NotificationController {
  constructor(private readonly notificationUseCases: NotificationUseCases) {}

  @Post('email')
  @TenantRequired()
  async sendEmail(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      to: string;
      subject: string;
      html: string;
      userId?: string;
    },
  ) {
    return this.notificationUseCases.sendEmail({
      tenantId,
      userId: body.userId,
      to: body.to,
      subject: body.subject,
      html: body.html,
    });
  }

  @Post('sms')
  @TenantRequired()
  async sendSMS(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      to: string;
      message: string;
      userId?: string;
    },
  ) {
    return this.notificationUseCases.sendSMS({
      tenantId,
      userId: body.userId,
      to: body.to,
      message: body.message,
    });
  }

  @Post('push')
  @TenantRequired()
  async sendPushNotification(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      userId: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    },
  ) {
    return this.notificationUseCases.sendPushNotification(
      tenantId,
      body.userId,
      body.title,
      body.body,
      body.data,
    );
  }

  @Get()
  @TenantRequired()
  async getNotifications(
    @CurrentTenant() tenantId: string,
    @Query('userId') userId?: string,
    @Query('type') type?: NotificationType,
  ) {
    return this.notificationUseCases.getTenantNotifications(tenantId, {
      userId,
      type,
    });
  }

  @Get(':id')
  @TenantRequired()
  async getNotification(@Param('id') id: string) {
    return this.notificationUseCases.getNotificationById(id);
  }

  @Patch(':id/read')
  @TenantRequired()
  async markAsRead(@Param('id') id: string) {
    await this.notificationUseCases.markAsRead(id);
    return { success: true };
  }

  @Post('sale-confirmation')
  @TenantRequired()
  async sendSaleConfirmation(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      userId: string;
      saleId: string;
      total: number;
    },
  ) {
    return this.notificationUseCases.sendSaleConfirmation(
      tenantId,
      body.userId,
      body.saleId,
      body.total,
    );
  }

  @Post('low-stock-alert')
  @TenantRequired()
  async sendLowStockAlert(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      productId: string;
      productName: string;
      currentStock: number;
      minStock: number;
    },
  ) {
    return this.notificationUseCases.sendLowStockAlert(
      tenantId,
      body.productId,
      body.productName,
      body.currentStock,
      body.minStock,
    );
  }
}
