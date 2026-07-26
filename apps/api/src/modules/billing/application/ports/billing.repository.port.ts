import type { Subscription } from '../../domain/entities/subscription.entity.js';
import type { Plan } from '../../domain/value-objects/plan.vo.js';

export interface TenantSnapshot {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  status: string;
}

export interface BillingRepositoryPort {
  findSubscriptionByTenant(tenantId: string): Promise<Subscription | null>;
  findSubscriptionByCustomer(stripeCustomerId: string): Promise<Subscription | null>;
  findSubscriptionByStripeSubId(stripeSubId: string): Promise<Subscription | null>;
  upsertSubscription(tenantId: string, stripeCustomerId: string): Promise<void>;
  activateSubscription(
    tenantId: string,
    stripeSubId: string,
    currentPeriodEnd: Date,
  ): Promise<void>;
  markSubscriptionPastDue(tenantId: string): Promise<void>;
  cancelSubscription(tenantId: string): Promise<void>;
  updateTenantPlan(tenantId: string, plan: Plan): Promise<void>;
  updateTenantStatus(tenantId: string, status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED'): Promise<void>;
  findTenantSnapshot(tenantId: string): Promise<TenantSnapshot | null>;
}
