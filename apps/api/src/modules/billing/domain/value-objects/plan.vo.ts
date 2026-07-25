export type Plan = 'STARTER' | 'GROWTH' | 'PRO';

export function priceIdFor(plan: Plan): string | undefined {
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

export function isValidPlan(value: string): value is Plan {
  return value === 'STARTER' || value === 'GROWTH' || value === 'PRO';
}
