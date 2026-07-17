export type CashSessionStatus = 'OPEN' | 'CLOSED' | 'RECONCILING';
export type CashMovementType = 'IN' | 'OUT' | 'SALE' | 'REFUND';

export interface CashSessionProps {
  id: number;
  branchCode: string;
  userId: string;
  openedAt: Date;
  closedAt?: Date;
  openingBalance: number;
  expectedBalance: number;
  countedBalance?: number;
  difference?: number;
  status: CashSessionStatus;
  notes?: string;
}

export class CashSession {
  private props: CashSessionProps;

  private constructor(props: CashSessionProps) {
    this.props = props;
  }

  static create(props: {
    id: number;
    branchCode: string;
    userId: string;
    openingBalance: number;
  }): CashSession {
    if (props.openingBalance < 0) {
      throw new Error('Saldo inicial no puede ser negativo');
    }
    const now = new Date();
    return new CashSession({
      id: props.id,
      branchCode: props.branchCode,
      userId: props.userId,
      openedAt: now,
      closedAt: undefined,
      openingBalance: props.openingBalance,
      expectedBalance: 0, // se calcula al cerrar
      countedBalance: undefined,
      difference: undefined,
      status: 'OPEN',
      notes: undefined,
    });
  }

  static rehydrate(props: CashSessionProps): CashSession {
    return new CashSession(props);
  }

  get id(): number { return this.props.id; }
  get branchCode(): string { return this.props.branchCode; }
  get userId(): string { return this.props.userId; }
  get openedAt(): Date { return this.props.openedAt; }
  get closedAt(): Date | undefined { return this.props.closedAt; }
  get openingBalance(): number { return this.props.openingBalance; }
  get expectedBalance(): number { return this.props.expectedBalance; }
  get countedBalance(): number | undefined { return this.props.countedBalance; }
  get difference(): number | undefined { return this.props.difference; }
  get status(): CashSessionStatus { return this.props.status; }
  get notes(): string | undefined { return this.props.notes; }

  close(countedBalance: number, notes?: string): void {
    if (this.props.status !== 'OPEN') {
      throw new Error(`No se puede cerrar sesión en estado ${this.props.status}`);
    }
    if (countedBalance < 0) throw new Error('Conteo no puede ser negativo');
    this.props.closedAt = new Date();
    this.props.countedBalance = countedBalance;
    this.props.difference = Math.round((countedBalance - this.props.expectedBalance) * 10000) / 10000;
    this.props.status = 'CLOSED';
    this.props.notes = notes;
  }

  setExpectedBalance(amount: number): void {
    this.props.expectedBalance = amount;
  }

  toDTO(): CashSessionDTO {
    return {
      id: this.props.id,
      branchCode: this.props.branchCode,
      userId: this.props.userId,
      openedAt: this.props.openedAt,
      closedAt: this.props.closedAt,
      openingBalance: this.props.openingBalance,
      expectedBalance: this.props.expectedBalance,
      countedBalance: this.props.countedBalance,
      difference: this.props.difference,
      status: this.props.status,
      notes: this.props.notes,
    };
  }
}

export interface CashSessionDTO {
  id: number;
  branchCode: string;
  userId: string;
  openedAt: Date;
  closedAt?: Date;
  openingBalance: number;
  expectedBalance: number;
  countedBalance?: number;
  difference?: number;
  status: CashSessionStatus;
  notes?: string;
}

export interface CashMovementProps {
  id: number;
  sessionId: number;
  type: CashMovementType;
  amount: number;
  reason?: string;
  createdAt: Date;
}

export class CashMovement {
  private props: CashMovementProps;

  private constructor(props: CashMovementProps) {
    this.props = props;
  }

  static rehydrate(props: CashMovementProps): CashMovement {
    return new CashMovement(props);
  }

  get id(): number { return this.props.id; }
  get sessionId(): number { return this.props.sessionId; }
  get type(): CashMovementType { return this.props.type; }
  get amount(): number { return this.props.amount; }
  get reason(): string | undefined { return this.props.reason; }
  get createdAt(): Date { return this.props.createdAt; }

  toDTO(): CashMovementDTO {
    return {
      id: this.props.id,
      sessionId: this.props.sessionId,
      type: this.props.type,
      amount: this.props.amount,
      reason: this.props.reason,
      createdAt: this.props.createdAt,
    };
  }
}

export interface CashMovementDTO {
  id: number;
  sessionId: number;
  type: CashMovementType;
  amount: number;
  reason?: string;
  createdAt: Date;
}