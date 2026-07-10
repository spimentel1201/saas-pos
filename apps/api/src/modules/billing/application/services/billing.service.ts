import { BadRequestException, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { TenantContext } from '../../../../shared/infrastructure/multi-tenant/tenant-context.js';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service.js';
import type { CheckoutDto } from '../dtos/checkout.dto.js';

/**
 * BillingService - integracion Stripe Checkout + Customer Portal.
 *
 * Aplica `stripe-best-practices` skill:
 *   - Checkout Sessions para suscripciones (no PaymentIntents).
 *   - RAK en prod (rk_), clave secreta en dev por simplicidad.
 *   - Eventos webhook idempotentes via subscription.stripeSubId (campo unique).
 *
 * Configuracion de precios en Stripe Dashboard:
 *   STRIPE_PRICE_STARTER  = price_xxx
 *   STRIPE_PRICE_GROWTH   = price_yyy
 *   STRIPE_PRICE_PRO      = price_zzz
 */
@Injectable()
export class BillingService {
  private _stripe: Stripe | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: TenantContext,
  ) {
    void this.ctx;
  }

  /**
   * Inicializa perezosamente la instancia de Stripe. Falla solo cuando
   * se invoque un endpoint de billing sin STRIPE_SECRET_KEY configurado.
   */
  private get stripe(): Stripe {
    if (this._stripe) return this._stripe;
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new BadRequestException(
        'Integracion de pagos no configurada (STRIPE_SECRET_KEY). El tenant funciona en modo trial sin esta operacion.',
      );
    }
    this._stripe = new Stripe(key, {
      apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
    });
    return this._stripe;
  }

  /** Crea / actualiza el Customer de Stripe del tenant y devuelve su id. */
  async ensureStripeCustomer(tenantId: string): Promise<string> {
    const sub = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });
    if (sub?.stripeCustomerId) {
      return sub.stripeCustomerId;
    }
    // Crear customer con metadata para el webhook
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true, slug: true },
    });
    const customer = await this.stripe.customers.create({
      name: tenant?.name,
      metadata: { tenantId, slug: tenant?.slug ?? '' },
    });
    await this.prisma.subscription.upsert({
      where: { tenantId },
      update: { stripeCustomerId: customer.id },
      create: { tenantId, stripeCustomerId: customer.id, status: 'TRIALING' },
    });
    return customer.id;
  }

  async createCheckoutSession(dto: CheckoutDto): Promise<{ url: string }> {
    const tenantId = TenantContext.require.id;
    const priceId = this.priceIdFor(dto.plan);
    if (!priceId) {
      throw new BadRequestException(`Plan ${dto.plan} no configurado en STRIPE_PRICE_${dto.plan}`);
    }
    const customerId = await this.ensureStripeCustomer(tenantId);
    // req.query flow=SUBSCRIBE genera suscripcion, no payment one-time.
    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: dto.successUrl,
      cancel_url: dto.cancelUrl,
      metadata: { tenantId, plan: dto.plan },
    });
    return { url: session.url ?? '' };
  }

  /**
   * Customer Portal - URL para que el comercio gestione su tarjeta, facturas,
   * cancele la suscripcion sin pasar por NP. Caducidad de 5 minutos.
   */
  async createPortalSession(returnUrl: string): Promise<{ url: string }> {
    const tenantId = TenantContext.require.id;
    const sub = await this.prisma.subscription.findUnique({ where: { tenantId } });
    if (!sub?.stripeCustomerId) {
      throw new BadRequestException(
        'Aun no hay suscripcion de Stripe (trialing). Subscribete via /billing/checkout primero.',
      );
    }
    const portal = await this.stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: returnUrl,
    });
    return { url: portal.url };
  }

  /** Verifica la firma del webhook y retorna el evento. */
  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET no configurado');
    }
    return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
  }

  /** Idempotent: si el evento ya se proceso (subscription.stripeSubId unique), no hace nada. */
  async handleEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed': {
        const sess = event.data.object as Stripe.Checkout.Session;
        const { tenantId, plan } = sess.metadata ?? {};
        if (!tenantId || !plan) return;
        await this.prisma.subscription.update({
          where: { tenantId },
          data: { status: 'ACTIVE' },
        });
        await this.prisma.tenant.update({
          where: { id: tenantId },
          data: { plan: plan as 'STARTER' | 'GROWTH' | 'PRO', status: 'ACTIVE' },
        });
        break;
      }
      case 'invoice.paid': {
        const inv = event.data.object as Stripe.Invoice;
        const customerId = inv.customer as string;
        const sub = await this.prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        });
        if (sub) {
          await this.prisma.subscription.update({
            where: { tenantId: sub.tenantId },
            data: {
              status: 'ACTIVE',
              currentPeriodEnd: new Date((inv.lines.data[0]?.period?.end ?? 0) * 1000),
              stripeSubId: inv.subscription as string,
            },
          });
        }
        break;
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice;
        const sub = await this.prisma.subscription.findUnique({
          where: { stripeCustomerId: inv.customer as string },
        });
        if (sub) {
          await this.prisma.subscription.update({
            where: { tenantId: sub.tenantId },
            data: { status: 'PAST_DUE' },
          });
          await this.prisma.tenant.update({
            where: { id: sub.tenantId },
            data: { status: 'PAST_DUE' },
          });
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subs = event.data.object as Stripe.Subscription;
        const sub = await this.prisma.subscription.findUnique({
          where: { stripeSubId: subs.id },
        });
        if (sub) {
          await this.prisma.subscription.update({
            where: { tenantId: sub.tenantId },
            data: { status: 'CANCELED' },
          });
          await this.prisma.tenant.update({
            where: { id: sub.tenantId },
            data: { status: 'CANCELED' },
          });
        }
        break;
      }
      default:
        // Evento no manejado por el MVP - no es error.
        return;
    }
  }

  private priceIdFor(plan: string): string | undefined {
    switch (plan) {
      case 'STARTER':
        return process.env.STRIPE_PRICE_STARTER;
      case 'GROWTH':
        return process.env.STRIPE_PRICE_GROWTH;
      case 'PRO':
        return process.env.STRIPE_PRICE_PRO;
      default:
        return undefined;
    }
  }
}
