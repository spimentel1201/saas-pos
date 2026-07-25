export type Plan = 'STARTER' | 'GROWTH' | 'PRO';

export interface PlanLimits {
  branches: number | null;
  products: number | null;
}

export function getPlanLimits(plan: Plan): PlanLimits {
  switch (plan) {
    case 'STARTER':
      return { branches: 1, products: 200 };
    case 'GROWTH':
      return { branches: 5, products: null };
    case 'PRO':
      return { branches: null, products: null };
    default:
      return { branches: 1, products: 200 };
  }
}

export function assertBranchLimit(plan: Plan, currentCount: number): void {
  const limits = getPlanLimits(plan);
  if (limits.branches === null) return;
  if (currentCount >= limits.branches) {
    throw new Error(`Plan ${plan} limita a ${limits.branches} sucursales. Upgrade a Growth/Pro.`);
  }
}

export function assertProductLimit(plan: Plan, currentCount: number): void {
  const limits = getPlanLimits(plan);
  if (limits.products === null) return;
  if (currentCount >= limits.products) {
    throw new Error(`Plan ${plan} limita a ${limits.products} productos. Upgrade a Growth/Pro.`);
  }
}

export function isValidPlan(value: string): value is Plan {
  return value === 'STARTER' || value === 'GROWTH' || value === 'PRO';
}
