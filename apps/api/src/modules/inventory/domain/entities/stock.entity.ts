export type MovementType = 'PURCHASE' | 'SALE' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN' | 'LOSS';

export interface StockProps {
  id: number;
  branchCode: string;
  productId: string;
  qty: number;
  reserved: number;
  minQty: number;
  maxQty: number;
  avgCost: number;
  version: number;
  updatedAt: Date;
}

export class Stock {
  private props: StockProps;

  private constructor(props: StockProps) {
    this.props = props;
  }

  static rehydrate(props: StockProps): Stock {
    return new Stock(props);
  }

  get id(): number {
    return this.props.id;
  }
  get branchCode(): string {
    return this.props.branchCode;
  }
  get productId(): string {
    return this.props.productId;
  }
  get qty(): number {
    return this.props.qty;
  }
  get reserved(): number {
    return this.props.reserved;
  }
  get minQty(): number {
    return this.props.minQty;
  }
  get maxQty(): number {
    return this.props.maxQty;
  }
  get avgCost(): number {
    return this.props.avgCost;
  }
  get version(): number {
    return this.props.version;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get available(): number {
    return this.props.qty - this.props.reserved;
  }

  get isLow(): boolean {
    return this.props.qty <= this.props.minQty;
  }

  get isOverMax(): boolean {
    return this.props.maxQty > 0 && this.props.qty > this.props.maxQty;
  }

  applyDelta(delta: number, newAvgCost?: number): void {
    const next = this.props.qty + delta;
    if (next < 0) {
      throw new Error('Stock no puede quedar negativo');
    }
    this.props.qty = next;
    if (newAvgCost !== undefined && newAvgCost >= 0) {
      this.props.avgCost = newAvgCost;
    }
    this.props.version += 1;
    this.props.updatedAt = new Date();
  }

  reserve(qty: number): void {
    if (qty <= 0) throw new Error('Cantidad a reservar debe ser positiva');
    if (this.available < qty) {
      throw new Error('Stock disponible insuficiente para reservar');
    }
    this.props.reserved += qty;
    this.props.version += 1;
    this.props.updatedAt = new Date();
  }

  release(qty: number): void {
    if (qty <= 0) throw new Error('Cantidad a liberar debe ser positiva');
    if (this.props.reserved < qty) {
      throw new Error('No hay suficiente stock reservado para liberar');
    }
    this.props.reserved -= qty;
    this.props.version += 1;
    this.props.updatedAt = new Date();
  }

  updateMinMax(minQty: number, maxQty: number): void {
    if (minQty < 0) throw new Error('minQty no puede ser negativo');
    if (maxQty < 0) throw new Error('maxQty no puede ser negativo');
    this.props.minQty = minQty;
    this.props.maxQty = maxQty;
    this.props.version += 1;
    this.props.updatedAt = new Date();
  }

  toDTO(): StockDTO {
    return {
      id: this.props.id,
      branchCode: this.props.branchCode,
      productId: this.props.productId,
      qty: this.props.qty,
      reserved: this.props.reserved,
      available: this.available,
      minQty: this.props.minQty,
      maxQty: this.props.maxQty,
      avgCost: this.props.avgCost,
      version: this.props.version,
      isLow: this.isLow,
      isOverMax: this.isOverMax,
      updatedAt: this.props.updatedAt,
    };
  }
}

export interface StockDTO {
  id: number;
  branchCode: string;
  productId: string;
  qty: number;
  reserved: number;
  available: number;
  minQty: number;
  maxQty: number;
  avgCost: number;
  version: number;
  isLow: boolean;
  isOverMax: boolean;
  updatedAt: Date;
}

export interface MovementProps {
  id: number;
  stockId: number;
  type: MovementType;
  delta: number;
  reason?: string;
  ref?: string;
  branchCode: string;
  userId: string;
  createdAt: Date;
}

export class Movement {
  private props: MovementProps;

  private constructor(props: MovementProps) {
    this.props = props;
  }

  static rehydrate(props: MovementProps): Movement {
    return new Movement(props);
  }

  get id(): number {
    return this.props.id;
  }
  get stockId(): number {
    return this.props.stockId;
  }
  get type(): MovementType {
    return this.props.type;
  }
  get delta(): number {
    return this.props.delta;
  }
  get reason(): string | undefined {
    return this.props.reason;
  }
  get ref(): string | undefined {
    return this.props.ref;
  }
  get branchCode(): string {
    return this.props.branchCode;
  }
  get userId(): string {
    return this.props.userId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  toDTO(): MovementDTO {
    return {
      id: this.props.id,
      stockId: this.props.stockId,
      type: this.props.type,
      delta: this.props.delta,
      reason: this.props.reason,
      ref: this.props.ref,
      branchCode: this.props.branchCode,
      userId: this.props.userId,
      createdAt: this.props.createdAt,
    };
  }
}

export interface MovementDTO {
  id: number;
  stockId: number;
  type: MovementType;
  delta: number;
  reason?: string;
  ref?: string;
  branchCode: string;
  userId: string;
  createdAt: Date;
}

export type TransferStatus = 'PENDING' | 'SHIPPED' | 'RECEIVED' | 'CANCELED';

export interface TransferItem {
  productId: string;
  qty: number;
}

export interface TransferProps {
  id: string;
  fromBranch: string;
  toBranch: string;
  status: TransferStatus;
  items: TransferItem[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class StockTransfer {
  private props: TransferProps;

  private constructor(props: TransferProps) {
    this.props = props;
  }

  static create(props: {
    id: string;
    fromBranch: string;
    toBranch: string;
    items: TransferItem[];
    createdBy: string;
  }): StockTransfer {
    if (props.fromBranch === props.toBranch) {
      throw new Error('La sucursal origen y destino no pueden ser iguales');
    }
    if (props.items.length === 0) {
      throw new Error('La transferencia debe tener al menos un ítem');
    }
    const now = new Date();
    return new StockTransfer({
      id: props.id,
      fromBranch: props.fromBranch,
      toBranch: props.toBranch,
      status: 'PENDING',
      items: props.items,
      createdBy: props.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(props: TransferProps): StockTransfer {
    return new StockTransfer(props);
  }

  get id(): string {
    return this.props.id;
  }
  get fromBranch(): string {
    return this.props.fromBranch;
  }
  get toBranch(): string {
    return this.props.toBranch;
  }
  get status(): TransferStatus {
    return this.props.status;
  }
  get items(): TransferItem[] {
    return this.props.items;
  }
  get createdBy(): string {
    return this.props.createdBy;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  ship(): void {
    if (this.props.status !== 'PENDING') {
      throw new Error(`No se puede enviar una transferencia en estado ${this.props.status}`);
    }
    this.props.status = 'SHIPPED';
    this.touch();
  }

  receive(): void {
    if (this.props.status !== 'SHIPPED') {
      throw new Error(`No se puede recibir una transferencia en estado ${this.props.status}`);
    }
    this.props.status = 'RECEIVED';
    this.touch();
  }

  cancel(): void {
    if (this.props.status === 'RECEIVED' || this.props.status === 'CANCELED') {
      throw new Error(`No se puede cancelar una transferencia en estado ${this.props.status}`);
    }
    this.props.status = 'CANCELED';
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toDTO(): TransferDTO {
    return {
      id: this.props.id,
      fromBranch: this.props.fromBranch,
      toBranch: this.props.toBranch,
      status: this.props.status,
      items: this.props.items,
      createdBy: this.props.createdBy,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}

export interface TransferDTO {
  id: string;
  fromBranch: string;
  toBranch: string;
  status: TransferStatus;
  items: TransferItem[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
