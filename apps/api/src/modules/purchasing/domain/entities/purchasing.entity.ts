export interface SupplierProps {
  id: string;
  name: string;
  contact?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  createdAt: Date;
}

export class Supplier {
  private props: SupplierProps;

  private constructor(props: SupplierProps) {
    this.props = props;
  }

  static create(props: {
    id: string;
    name: string;
    contact?: string;
    taxId?: string;
    email?: string;
    phone?: string;
  }): Supplier {
    return new Supplier({
      id: props.id,
      name: props.name.trim(),
      contact: props.contact?.trim(),
      taxId: props.taxId?.trim(),
      email: props.email?.trim(),
      phone: props.phone?.trim(),
      createdAt: new Date(),
    });
  }

  static rehydrate(props: SupplierProps): Supplier {
    return new Supplier(props);
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get contact(): string | undefined {
    return this.props.contact;
  }
  get taxId(): string | undefined {
    return this.props.taxId;
  }
  get email(): string | undefined {
    return this.props.email;
  }
  get phone(): string | undefined {
    return this.props.phone;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  updateName(name: string): void {
    this.props.name = name.trim();
  }
  updateContact(contact?: string): void {
    this.props.contact = contact?.trim();
  }
  updateTaxId(taxId?: string): void {
    this.props.taxId = taxId?.trim();
  }
  updateEmail(email?: string): void {
    this.props.email = email?.trim();
  }
  updatePhone(phone?: string): void {
    this.props.phone = phone?.trim();
  }

  toDTO(): SupplierDTO {
    return {
      id: this.props.id,
      name: this.props.name,
      contact: this.props.contact,
      taxId: this.props.taxId,
      email: this.props.email,
      phone: this.props.phone,
      createdAt: this.props.createdAt,
    };
  }
}

export interface SupplierDTO {
  id: string;
  name: string;
  contact?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  createdAt: Date;
}

export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'PARTIAL' | 'RECEIVED' | 'CANCELED';

export interface PurchaseOrderItem {
  productId: string;
  qty: number;
  unitCost: number;
}

export interface PurchaseOrderProps {
  id: string;
  branchCode: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  total: number;
  items: PurchaseOrderItem[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PurchaseOrder {
  private props: PurchaseOrderProps;

  private constructor(props: PurchaseOrderProps) {
    this.props = props;
  }

  static create(props: {
    id: string;
    branchCode: string;
    supplierId: string;
    items: PurchaseOrderItem[];
    createdBy: string;
  }): PurchaseOrder {
    if (props.items.length === 0) {
      throw new Error('La orden de compra debe tener al menos un ítem');
    }
    const total = props.items.reduce((sum, it) => sum + it.qty * it.unitCost, 0);
    const now = new Date();
    return new PurchaseOrder({
      id: props.id,
      branchCode: props.branchCode,
      supplierId: props.supplierId,
      status: 'DRAFT',
      total,
      items: props.items,
      createdBy: props.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(props: PurchaseOrderProps): PurchaseOrder {
    return new PurchaseOrder(props);
  }

  get id(): string {
    return this.props.id;
  }
  get branchCode(): string {
    return this.props.branchCode;
  }
  get supplierId(): string {
    return this.props.supplierId;
  }
  get status(): PurchaseOrderStatus {
    return this.props.status;
  }
  get total(): number {
    return this.props.total;
  }
  get items(): PurchaseOrderItem[] {
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

  send(): void {
    if (this.props.status !== 'DRAFT') {
      throw new Error(`No se puede enviar OC en estado ${this.props.status}`);
    }
    this.props.status = 'SENT';
    this.touch();
  }

  markPartial(): void {
    if (this.props.status !== 'SENT' && this.props.status !== 'PARTIAL') {
      throw new Error(`No se puede marcar parcial OC en estado ${this.props.status}`);
    }
    this.props.status = 'PARTIAL';
    this.touch();
  }

  markReceived(): void {
    if (this.props.status !== 'SENT' && this.props.status !== 'PARTIAL') {
      throw new Error(`No se puede recibir OC en estado ${this.props.status}`);
    }
    this.props.status = 'RECEIVED';
    this.touch();
  }

  cancel(): void {
    if (this.props.status === 'RECEIVED' || this.props.status === 'CANCELED') {
      throw new Error(`No se puede cancelar OC en estado ${this.props.status}`);
    }
    this.props.status = 'CANCELED';
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  toDTO(): PurchaseOrderDTO {
    return {
      id: this.props.id,
      branchCode: this.props.branchCode,
      supplierId: this.props.supplierId,
      status: this.props.status,
      total: this.props.total,
      items: this.props.items,
      createdBy: this.props.createdBy,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}

export interface PurchaseOrderDTO {
  id: string;
  branchCode: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  total: number;
  items: PurchaseOrderItem[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseReceiptProps {
  id: number;
  poId: string;
  receivedAt: Date;
  receivedBy: string;
  items: PurchaseOrderItem[];
}

export class PurchaseReceipt {
  private props: PurchaseReceiptProps;

  private constructor(props: PurchaseReceiptProps) {
    this.props = props;
  }

  static rehydrate(props: PurchaseReceiptProps): PurchaseReceipt {
    return new PurchaseReceipt(props);
  }

  get id(): number {
    return this.props.id;
  }
  get poId(): string {
    return this.props.poId;
  }
  get receivedAt(): Date {
    return this.props.receivedAt;
  }
  get receivedBy(): string {
    return this.props.receivedBy;
  }
  get items(): PurchaseOrderItem[] {
    return this.props.items;
  }

  toDTO(): PurchaseReceiptDTO {
    return {
      id: this.props.id,
      poId: this.props.poId,
      receivedAt: this.props.receivedAt,
      receivedBy: this.props.receivedBy,
      items: this.props.items,
    };
  }
}

export interface PurchaseReceiptDTO {
  id: number;
  poId: string;
  receivedAt: Date;
  receivedBy: string;
  items: PurchaseOrderItem[];
}
