export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'INCOMPLETE';

export interface SubscriptionProps {
  id: string;
  tenantId: string;
  stripeCustomerId: string | null;
  stripeSubId: string | null;
  status: SubscriptionStatus;
  currentPeriodEnd: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Subscription {
  private props: SubscriptionProps;

  private constructor(props: SubscriptionProps) {
    this.props = props;
  }

  static create(tenantId: string): Subscription {
    const now = new Date();
    return new Subscription({
      id: '',
      tenantId,
      stripeCustomerId: null,
      stripeSubId: null,
      status: 'TRIALING',
      currentPeriodEnd: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(props: SubscriptionProps): Subscription {
    return new Subscription(props);
  }

  get id() {
    return this.props.id;
  }
  get tenantId() {
    return this.props.tenantId;
  }
  get stripeCustomerId() {
    return this.props.stripeCustomerId;
  }
  get stripeSubId() {
    return this.props.stripeSubId;
  }
  get status() {
    return this.props.status;
  }
  get currentPeriodEnd() {
    return this.props.currentPeriodEnd;
  }

  assignCustomer(customerId: string): void {
    this.props.stripeCustomerId = customerId;
  }

  activate(stripeSubId: string, currentPeriodEnd: Date): void {
    this.props.stripeSubId = stripeSubId;
    this.props.status = 'ACTIVE';
    this.props.currentPeriodEnd = currentPeriodEnd;
  }

  markPastDue(): void {
    this.props.status = 'PAST_DUE';
  }

  cancel(): void {
    this.props.status = 'CANCELED';
  }

  get isActive(): boolean {
    return this.props.status === 'ACTIVE';
  }

  get isTrialing(): boolean {
    return this.props.status === 'TRIALING';
  }

  get isCanceled(): boolean {
    return this.props.status === 'CANCELED';
  }

  toDTO() {
    return {
      id: this.props.id,
      tenantId: this.props.tenantId,
      stripeCustomerId: this.props.stripeCustomerId,
      stripeSubId: this.props.stripeSubId,
      status: this.props.status,
      currentPeriodEnd: this.props.currentPeriodEnd,
    };
  }
}
