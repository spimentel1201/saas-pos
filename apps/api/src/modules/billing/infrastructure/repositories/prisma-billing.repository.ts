import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service.js';
import type {
  BillingRepositoryPort,
  TenantSnapshot,
} from '../../application/ports/billing.repository.port.js';
import {
  Subscription,
  type SubscriptionStatus,
} from '../../domain/entities/subscription.entity.js';
import type { Plan } from '../../domain/value-objects/plan.vo.js';

@Injectable()
export class PrismaBillingRepository implements BillingRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(row: {
    id: string;
    tenantId: string;
    stripeCustomerId: string | null;
    stripeSubId: string | null;
    status: string;
    currentPeriodEnd: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): Subscription {
    return Subscription.rehydrate({
      id: row.id,
      tenantId: row.tenantId,
      stripeCustomerId: row.stripeCustomerId,
      stripeSubId: row.stripeSubId,
      status: row.status as SubscriptionStatus,
      currentPeriodEnd: row.currentPeriodEnd,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findSubscriptionByTenant(tenantId: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findUnique({ where: { tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findSubscriptionByCustomer(stripeCustomerId: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findUnique({
      where: { stripeCustomerId },
    });
    return row ? this.toDomain(row) : null;
  }

  async findSubscriptionByStripeSubId(stripeSubId: string): Promise<Subscription | null> {
    const row = await this.prisma.subscription.findUnique({
      where: { stripeSubId },
    });
    return row ? this.toDomain(row) : null;
  }

  async upsertSubscription(tenantId: string, stripeCustomerId: string): Promise<void> {
    await this.prisma.subscription.upsert({
      where: { tenantId },
      update: { stripeCustomerId },
      create: { tenantId, stripeCustomerId, status: 'TRIALING' },
    });
  }

  async activateSubscription(
    tenantId: string,
    stripeSubId: string,
    currentPeriodEnd: Date,
  ): Promise<void> {
    await this.prisma.subscription.update({
      where: { tenantId },
      data: { status: 'ACTIVE', stripeSubId, currentPeriodEnd },
    });
  }

  async markSubscriptionPastDue(tenantId: string): Promise<void> {
    await this.prisma.subscription.update({
      where: { tenantId },
      data: { status: 'PAST_DUE' },
    });
  }

  async cancelSubscription(tenantId: string): Promise<void> {
    await this.prisma.subscription.update({
      where: { tenantId },
      data: { status: 'CANCELED' },
    });
  }

  async updateTenantPlan(tenantId: string, plan: Plan): Promise<void> {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { plan },
    });
  }

  async updateTenantStatus(
    tenantId: string,
    status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED',
  ): Promise<void> {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status },
    });
  }

  async findTenantSnapshot(tenantId: string): Promise<TenantSnapshot | null> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, slug: true, plan: true, status: true },
    });
    if (!tenant) return null;
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan as Plan,
      status: tenant.status,
    };
  }
}
