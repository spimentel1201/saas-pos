import { Plan } from '../value-objects/plan.vo.js';

export type TenantStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'PAUSED';

export interface TenantProps {
  id: string;
  name: string;
  slug: string;
  schemaName: string;
  plan: Plan;
  status: TenantStatus;
  baseDomain?: string;
  onboardingComplete?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BranchInfoProps {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  createdAt: Date;
}

export class Tenant {
  private props: TenantProps;

  private constructor(props: TenantProps) {
    this.props = props;
  }

  static create(props: {
    name: string;
    slug: string;
    schemaName: string;
    plan?: Plan;
    status?: TenantStatus;
    baseDomain?: string;
  }): Tenant {
    const name = props.name.trim();
    if (!name) throw new Error('Tenant name is required');
    if (name.length > 120) throw new Error('Tenant name too long (max 120)');

    const slug = props.slug.trim().toLowerCase();
    if (!slug) throw new Error('Tenant slug is required');

    const now = new Date();
    return new Tenant({
      id: '',
      name,
      slug,
      schemaName: props.schemaName,
      plan: props.plan ?? 'STARTER',
      status: props.status ?? 'TRIALING',
      baseDomain: props.baseDomain,
      onboardingComplete: false,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(props: TenantProps): Tenant {
    return new Tenant(props);
  }

  get id() {
    return this.props.id;
  }
  get name() {
    return this.props.name;
  }
  get slug() {
    return this.props.slug;
  }
  get schemaName() {
    return this.props.schemaName;
  }
  get plan() {
    return this.props.plan;
  }
  get status() {
    return this.props.status;
  }
  get baseDomain() {
    return this.props.baseDomain;
  }
  get onboardingComplete() {
    return this.props.onboardingComplete ?? false;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  markOnboardingComplete(): void {
    this.props.onboardingComplete = true;
  }

  get isActive(): boolean {
    return this.props.status === 'ACTIVE' || this.props.status === 'TRIALING';
  }

  toDTO() {
    return {
      id: this.props.id,
      name: this.props.name,
      slug: this.props.slug,
      plan: this.props.plan,
      status: this.props.status,
      onboardingComplete: this.onboardingComplete,
    };
  }
}

export class BranchInfo {
  private props: BranchInfoProps;

  private constructor(props: BranchInfoProps) {
    this.props = props;
  }

  static create(props: { tenantId: string; name: string; code: string }): BranchInfo {
    const name = props.name.trim();
    if (!name) throw new Error('Branch name is required');
    const code = props.code.trim().toUpperCase();
    if (!code) throw new Error('Branch code is required');
    return new BranchInfo({
      id: '',
      tenantId: props.tenantId,
      name,
      code,
      createdAt: new Date(),
    });
  }

  static rehydrate(props: BranchInfoProps): BranchInfo {
    return new BranchInfo(props);
  }

  get id() {
    return this.props.id;
  }
  get tenantId() {
    return this.props.tenantId;
  }
  get name() {
    return this.props.name;
  }
  get code() {
    return this.props.code;
  }
  get createdAt() {
    return this.props.createdAt;
  }

  toDTO() {
    return {
      id: this.props.id,
      code: this.props.code,
      name: this.props.name,
      createdAt: this.props.createdAt,
    };
  }
}
