import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { TenantContext } from '../../../../shared/infrastructure/multi-tenant/tenant-context.js';
import { BILLING_REPO } from '../../billing.tokens.js';
import { InvalidPlanError, NoSubscriptionError } from '../../domain/errors/billing.errors.js';
import { type Plan, priceIdFor } from '../../domain/value-objects/plan.vo.js';
import type { CheckoutDto } from '../dtos/checkout.dto.js';
import type { BillingRepositoryPort } from '../ports/billing.repository.port.js';

/**
 * BillingUseCases - integracion Stripe Checkout + Customer Portal.
 *
 * Aplica `stripe-best-practices` skill:
 *   - Checkout Sessions para suscripciones (no PaymentIntents).
 *   - RAK en prod (rk_), clave secreta en dev por simplicidad.
 *   - Eventos webhook idempotentes via subscription.stripeSubId (campo unique).
 */
@Injectable()
export class BillingUseCases {
  private _stripe: Stripe | null = null;

  constructor(@Inject(BILLING_REPO) private readonly repo: BillingRepositoryPort) {}

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
    const sub = await this.repo.findSubscriptionByTenant(tenantId);
    if (sub?.stripeCustomerId) return sub.stripeCustomerId;

    const tenant = await this.repo.findTenantSnapshot(tenantId);
    const customer = await this.stripe.customers.create({
      name: tenant?.name,
      metadata: { tenantId, slug: tenant?.slug ?? '' },
    });

    await this.repo.upsertSubscription(tenantId, customer.id);
    return customer.id;
  }

  async createCheckoutSession(dto: CheckoutDto): Promise<{ url: string }> {
    const tenantId = TenantContext.require.id;
    const priceId = priceIdFor(dto.plan);
    if (!priceId) throw new InvalidPlanError(dto.plan);

    const customerId = await this.ensureStripeCustomer(tenantId);
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

  async createPortalSession(returnUrl: string): Promise<{ url: string }> {
    const tenantId = TenantContext.require.id;
    const sub = await this.repo.findSubscriptionByTenant(tenantId);
    if (!sub?.stripeCustomerId) throw new NoSubscriptionError();

    const portal = await this.stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: returnUrl,
    });
    return { url: portal.url };
  }

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
        await this.repo.updateTenantPlan(tenantId, plan as Plan);
        await this.repo.updateTenantStatus(tenantId, 'ACTIVE');
        break;
      }
      case 'invoice.paid': {
        const inv = event.data.object as Stripe.Invoice;
        const sub = await this.repo.findSubscriptionByCustomer(inv.customer as string);
        if (sub) {
          await this.repo.activateSubscription(
            sub.tenantId,
            inv.subscription as string,
            new Date((inv.lines.data[0]?.period?.end ?? 0) * 1000),
          );
        }
        break;
      }
      case 'invoice.payment_failed': {
        const inv = event.data.object as Stripe.Invoice;
        const sub = await this.repo.findSubscriptionByCustomer(inv.customer as string);
        if (sub) {
          await this.repo.markSubscriptionPastDue(sub.tenantId);
          await this.repo.updateTenantStatus(sub.tenantId, 'PAST_DUE');
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subs = event.data.object as Stripe.Subscription;
        const sub = await this.repo.findSubscriptionByStripeSubId(subs.id);
        if (sub) {
          await this.repo.cancelSubscription(sub.tenantId);
          await this.repo.updateTenantStatus(sub.tenantId, 'CANCELED');
        }
        break;
      }
      default:
        return;
    }
  }
}
