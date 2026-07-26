import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentTenant } from '../../../../shared/infrastructure/http/current-tenant.decorator.js';
import { TenantRequired } from '../../../../shared/infrastructure/multi-tenant/tenant-required.decorator.js';
import { NotificationUseCases } from '../../application/use-cases/notification.use-case.js';
import { NotificationType } from '../../domain/entities/notification.entity.js';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationUseCases: NotificationUseCases) {}

  @Post('email')
  @TenantRequired()
  @HttpCode(201)
  @ApiOperation({ summary: 'Enviar email transaccional' })
  @ApiBody({ schema: { properties: { to: { type: 'string' }, subject: { type: 'string' }, html: { type: 'string' }, userId: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'Email enviado' })
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
  @HttpCode(201)
  @ApiOperation({ summary: 'Enviar SMS' })
  @ApiBody({ schema: { properties: { to: { type: 'string' }, message: { type: 'string' }, userId: { type: 'string' } } } })
  @ApiResponse({ status: 201, description: 'SMS enviado' })
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
  @HttpCode(201)
  @ApiOperation({ summary: 'Enviar notificación push' })
  @ApiBody({ schema: { properties: { userId: { type: 'string' }, title: { type: 'string' }, body: { type: 'string' }, data: { type: 'object' } } } })
  @ApiResponse({ status: 201, description: 'Push notification enviada' })
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
  @ApiOperation({ summary: 'Obtener notificaciones del tenant' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: NotificationType })
  @ApiResponse({ status: 200, description: 'Lista de notificaciones' })
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
  @ApiOperation({ summary: 'Obtener notificación por ID' })
  @ApiResponse({ status: 200, description: 'Notificación encontrada' })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  async getNotification(@Param('id') id: string) {
    return this.notificationUseCases.getNotificationById(id);
  }

  @Patch(':id/read')
  @TenantRequired()
  @HttpCode(200)
  @ApiOperation({ summary: 'Marcar notificación como leída' })
  @ApiResponse({ status: 200, description: 'Notificación marcada como leída' })
  async markAsRead(@Param('id') id: string) {
    await this.notificationUseCases.markAsRead(id);
    return { success: true };
  }

  @Post('sale-confirmation')
  @TenantRequired()
  @HttpCode(201)
  @ApiOperation({ summary: 'Enviar confirmación de venta' })
  @ApiBody({ schema: { properties: { userId: { type: 'string' }, saleId: { type: 'string' }, total: { type: 'number' } } } })
  @ApiResponse({ status: 201, description: 'Confirmación enviada' })
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
  @HttpCode(201)
  @ApiOperation({ summary: 'Enviar alerta de stock bajo' })
  @ApiBody({ schema: { properties: { productId: { type: 'string' }, productName: { type: 'string' }, currentStock: { type: 'number' }, minStock: { type: 'number' } } } })
  @ApiResponse({ status: 201, description: 'Alerta enviada' })
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
