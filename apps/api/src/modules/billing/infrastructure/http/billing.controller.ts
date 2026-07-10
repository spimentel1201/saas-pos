import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { Public } from '../../../../shared/infrastructure/http/public.decorator.js';
import { TenantRequired } from '../../../../shared/infrastructure/multi-tenant/tenant-required.decorator.js';
import { JwtAuthGuard } from '../../../auth/infrastructure/http/jwt-auth.guard.js';
import { CheckoutDto } from '../../application/dtos/checkout.dto.js';
import { BillingService } from '../../application/services/billing.service.js';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @TenantRequired()
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Crea Stripe Checkout Session para suscribir al plan' })
  @ApiBody({ type: CheckoutDto })
  async createCheckout(@Body() dto: CheckoutDto): Promise<{ url: string }> {
    return this.billing.createCheckoutSession(dto);
  }

  @Get('portal')
  @UseGuards(JwtAuthGuard)
  @TenantRequired()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Crea Customer Portal Session (gestion tarjeta / cancelar)' })
  async createPortal(@Req() req: FastifyRequest): Promise<{ url: string }> {
    const returnUrl = `${req.protocol}://${req.headers.host}/billing`;
    return this.billing.createPortalSession(returnUrl);
  }

  /**
   * Webhook Stripe. Endpoint CRUD sin guards: la firma se valida con
   * STRIPE_WEBHOOK_SECRET mediante stripe.webhooks.constructEvent.
   *
   * Ruta fuera del prefijo /api/v1/* para evitar parseos del body:
   * montar en /webhooks/stripe viaBillingModule.configure(consumer).
   */
  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async webhook(@Req() req: FastifyRequest): Promise<{ received: boolean }> {
    const raw = (req.body as Buffer) ?? Buffer.alloc(0);
    const sig = (req.headers['stripe-signature'] as string) ?? '';
    const event = this.billing.constructEvent(raw, sig);
    await this.billing.handleEvent(event);
    return { received: true };
  }
}
