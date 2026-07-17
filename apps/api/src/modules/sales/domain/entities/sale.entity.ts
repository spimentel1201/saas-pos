export type SaleStatus = 'COMPLETED' | 'VOID' | 'RETURNED' | 'PARTIAL_RETURN';
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT' | 'MIXED';

export interface SaleItemProps {
  productId: string;
  variantId?: string;
  qty: number;
  unitPrice: number;
  taxAmount: number;
  discount: number;
  total: number;
}

export class SaleItem {
  private props: SaleItemProps;

  private constructor(props: SaleItemProps) {
    this.props = props;
  }

  static create(props: {
    productId: string;
    qty: number;
    unitPrice: number;
    taxRate?: number;
    discount?: number;
    variantId?: string;
  }): SaleItem {
    if (props.qty <= 0) throw new Error('Cantidad debe ser mayor a 0');
    if (props.unitPrice < 0) throw new Error('Precio no puede ser negativo');
    const lineSubtotal = props.qty * props.unitPrice;
    const taxAmount = props.taxRate ? round4(lineSubtotal * props.taxRate) : 0;
    const discount = props.discount ?? 0;
    const total = round4(lineSubtotal + taxAmount - discount);
    return new SaleItem({
      productId: props.productId,
      variantId: props.variantId,
      qty: props.qty,
      unitPrice: props.unitPrice,
      taxAmount,
      discount,
      total,
    });
  }

  static rehydrate(props: SaleItemProps): SaleItem {
    return new SaleItem(props);
  }

  get productId(): string {
    return this.props.productId;
  }
  get variantId(): string | undefined {
    return this.props.variantId;
  }
  get qty(): number {
    return this.props.qty;
  }
  get unitPrice(): number {
    return this.props.unitPrice;
  }
  get taxAmount(): number {
    return this.props.taxAmount;
  }
  get discount(): number {
    return this.props.discount;
  }
  get total(): number {
    return this.props.total;
  }

  toDTO(): SaleItemDTO {
    return {
      productId: this.props.productId,
      variantId: this.props.variantId,
      qty: this.props.qty,
      unitPrice: this.props.unitPrice,
      taxAmount: this.props.taxAmount,
      discount: this.props.discount,
      total: this.props.total,
    };
  }
}

export interface SaleItemDTO {
  productId: string;
  variantId?: string;
  qty: number;
  unitPrice: number;
  taxAmount: number;
  discount: number;
  total: number;
}

export interface SalePaymentProps {
  method: PaymentMethod;
  amount: number;
  ref?: string;
}

export class SalePayment {
  private props: SalePaymentProps;

  private constructor(props: SalePaymentProps) {
    this.props = props;
  }

  static create(props: { method: PaymentMethod; amount: number; ref?: string }): SalePayment {
    if (props.amount <= 0) throw new Error('Monto del pago debe ser mayor a 0');
    return new SalePayment({
      method: props.method,
      amount: round4(props.amount),
      ref: props.ref?.trim(),
    });
  }

  static rehydrate(props: SalePaymentProps): SalePayment {
    return new SalePayment(props);
  }

  get method(): PaymentMethod {
    return this.props.method;
  }
  get amount(): number {
    return this.props.amount;
  }
  get ref(): string | undefined {
    return this.props.ref;
  }

  toDTO(): SalePaymentDTO {
    return {
      method: this.props.method,
      amount: this.props.amount,
      ref: this.props.ref,
    };
  }
}

export interface SalePaymentDTO {
  method: PaymentMethod;
  amount: number;
  ref?: string;
}

export interface SaleProps {
  id: string;
  branchCode: string;
  userId: string;
  cashierSessionId?: number;
  numberSeq: number;
  customerId?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: SaleStatus;
  meta: Record<string, unknown>;
  items: SaleItem[];
  payments: SalePayment[];
  createdAt: Date;
}

export class Sale {
  private props: SaleProps;

  private constructor(props: SaleProps) {
    this.props = props;
  }

  static rehydrate(props: SaleProps): Sale {
    return new Sale(props);
  }

  get id(): string {
    return this.props.id;
  }
  get branchCode(): string {
    return this.props.branchCode;
  }
  get userId(): string {
    return this.props.userId;
  }
  get cashierSessionId(): number | undefined {
    return this.props.cashierSessionId;
  }
  get numberSeq(): number {
    return this.props.numberSeq;
  }
  get customerId(): string | undefined {
    return this.props.customerId;
  }
  get subtotal(): number {
    return this.props.subtotal;
  }
  get tax(): number {
    return this.props.tax;
  }
  get discount(): number {
    return this.props.discount;
  }
  get total(): number {
    return this.props.total;
  }
  get status(): SaleStatus {
    return this.props.status;
  }
  get meta(): Record<string, unknown> {
    return this.props.meta;
  }
  get items(): SaleItem[] {
    return this.props.items;
  }
  get payments(): SalePayment[] {
    return this.props.payments;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  get cashReceived(): number {
    return this.props.payments
      .filter((p) => p.method === 'CASH' || p.method === 'MIXED')
      .reduce((s, p) => s + p.amount, 0);
  }

  voidSale(): void {
    if (this.props.status === 'VOID') {
      throw new Error('La venta ya está anulada');
    }
    this.props.status = 'VOID';
  }

  markReturned(): void {
    if (this.props.status === 'RETURNED') {
      throw new Error('La venta ya está marcada como devuelta');
    }
    if (this.props.status === 'VOID') {
      throw new Error('La venta está anulada, no se puede devolver');
    }
    this.props.status = 'RETURNED';
  }

  markPartialReturn(): void {
    if (this.props.status === 'RETURNED') {
      throw new Error('La venta ya está devuelta totalmente');
    }
    if (this.props.status === 'VOID') {
      throw new Error('La venta está anulada, no se puede devolver parcialmente');
    }
    this.props.status = 'PARTIAL_RETURN';
  }

  toDTO(): SaleDTO {
    return {
      id: this.props.id,
      branchCode: this.props.branchCode,
      userId: this.props.userId,
      cashierSessionId: this.props.cashierSessionId,
      numberSeq: this.props.numberSeq,
      customerId: this.props.customerId,
      subtotal: this.props.subtotal,
      tax: this.props.tax,
      discount: this.props.discount,
      total: this.props.total,
      status: this.props.status,
      meta: this.props.meta,
      items: this.props.items.map((i) => i.toDTO()),
      payments: this.props.payments.map((p) => p.toDTO()),
      cashReceived: this.cashReceived,
      createdAt: this.props.createdAt,
    };
  }
}

export interface SaleDTO {
  id: string;
  branchCode: string;
  userId: string;
  cashierSessionId?: number;
  numberSeq: number;
  customerId?: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: SaleStatus;
  meta: Record<string, unknown>;
  items: SaleItemDTO[];
  payments: SalePaymentDTO[];
  cashReceived: number;
  createdAt: Date;
}

export interface SaleReturnProps {
  id: string;
  saleId: string;
  reason?: string;
  items: SaleItem[];
  total: number;
  createdAt: Date;
}

export class SaleReturn {
  private props: SaleReturnProps;

  private constructor(props: SaleReturnProps) {
    this.props = props;
  }

  static create(props: {
    id: string;
    saleId: string;
    reason?: string;
    items: SaleItem[];
  }): SaleReturn {
    const total = props.items.reduce((s, it) => s + it.total, 0);
    return new SaleReturn({
      id: props.id,
      saleId: props.saleId,
      reason: props.reason,
      items: props.items,
      total: round4(total),
      createdAt: new Date(),
    });
  }

  static rehydrate(props: SaleReturnProps): SaleReturn {
    return new SaleReturn(props);
  }

  get id(): string {
    return this.props.id;
  }
  get saleId(): string {
    return this.props.saleId;
  }
  get reason(): string | undefined {
    return this.props.reason;
  }
  get items(): SaleItem[] {
    return this.props.items;
  }
  get total(): number {
    return this.props.total;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  toDTO(): SaleReturnDTO {
    return {
      id: this.props.id,
      saleId: this.props.saleId,
      reason: this.props.reason,
      items: this.props.items.map((i) => i.toDTO()),
      total: this.props.total,
      createdAt: this.props.createdAt,
    };
  }
}

export interface SaleReturnDTO {
  id: string;
  saleId: string;
  reason?: string;
  items: SaleItemDTO[];
  total: number;
  createdAt: Date;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
