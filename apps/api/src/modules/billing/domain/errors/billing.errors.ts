import type { ValidationError } from '../../../../shared/domain/errors/domain-error.js';

export class BillingNotConfiguredError extends Error {
  constructor(envVar: string) {
    super(`Integracion de pagos no configurada (${envVar}). El tenant funciona en modo trial.`);
    this.name = 'BillingNotConfiguredError';
  }
}

export class NoSubscriptionError extends Error {
  constructor() {
    super(
      'Aun no hay suscripcion de Stripe (trialing). Subscribete via /billing/checkout primero.',
    );
    this.name = 'NoSubscriptionError';
  }
}

export class InvalidPlanError extends Error {
  constructor(plan: string) {
    super(`Plan ${plan} no configurado en STRIPE_PRICE_${plan}`);
    this.name = 'InvalidPlanError';
  }
}

export class WebhookSecretMissingError extends Error {
  constructor() {
    super('STRIPE_WEBHOOK_SECRET no configurado');
    this.name = 'WebhookSecretMissingError';
  }
}

export { ValidationError };
