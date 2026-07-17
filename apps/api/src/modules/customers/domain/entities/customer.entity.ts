export type CustomerType = 'INDIVIDUAL' | 'BUSINESS';
export type DocumentType = 'DNI' | 'RUC' | 'CE' | 'PASSPORT';

export interface CustomerProps {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: CustomerType;
  documentType?: DocumentType;
  documentNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  taxId?: string;
  creditBalance: number;
  notes?: string;
  active: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Customer {
  private props: CustomerProps;

  private constructor(props: CustomerProps) {
    this.props = props;
  }

  static create(props: {
    name: string;
    email?: string;
    phone?: string;
    type?: CustomerType;
    documentType?: DocumentType;
    documentNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    taxId?: string;
    notes?: string;
    createdBy?: string;
  }): Customer {
    const name = props.name.trim();
    if (!name) throw new Error('Nombre del cliente es requerido');

    if (props.type === 'BUSINESS' && props.documentType === 'RUC' && props.documentNumber) {
      if (props.documentNumber.length !== 11) {
        throw new Error('RUC debe tener 11 digitos');
      }
    }
    if (props.type === 'INDIVIDUAL' && props.documentType === 'DNI' && props.documentNumber) {
      if (props.documentNumber.length !== 8) {
        throw new Error('DNI debe tener 8 digitos');
      }
    }

    const now = new Date();
    return new Customer({
      id: '',
      name,
      email: props.email?.trim().toLowerCase(),
      phone: props.phone?.trim(),
      type: props.type ?? 'INDIVIDUAL',
      documentType: props.documentType,
      documentNumber: props.documentNumber?.trim(),
      address: props.address?.trim(),
      city: props.city?.trim(),
      state: props.state?.trim(),
      zipCode: props.zipCode?.trim(),
      taxId: props.taxId?.trim(),
      creditBalance: 0,
      notes: props.notes?.trim(),
      active: true,
      createdBy: props.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(props: CustomerProps): Customer {
    return new Customer(props);
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get email(): string | undefined {
    return this.props.email;
  }
  get phone(): string | undefined {
    return this.props.phone;
  }
  get type(): CustomerType {
    return this.props.type;
  }
  get documentType(): DocumentType | undefined {
    return this.props.documentType;
  }
  get documentNumber(): string | undefined {
    return this.props.documentNumber;
  }
  get address(): string | undefined {
    return this.props.address;
  }
  get city(): string | undefined {
    return this.props.city;
  }
  get state(): string | undefined {
    return this.props.state;
  }
  get zipCode(): string | undefined {
    return this.props.zipCode;
  }
  get taxId(): string | undefined {
    return this.props.taxId;
  }
  get creditBalance(): number {
    return this.props.creditBalance;
  }
  get notes(): string | undefined {
    return this.props.notes;
  }
  get active(): boolean {
    return this.props.active;
  }
  get createdBy(): string | undefined {
    return this.props.createdBy;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateName(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Nombre del cliente es requerido');
    this.props.name = trimmed;
    this.props.updatedAt = new Date();
  }

  updateContact(fields: {
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  }): void {
    if (fields.email !== undefined) this.props.email = fields.email.trim().toLowerCase();
    if (fields.phone !== undefined) this.props.phone = fields.phone.trim();
    if (fields.address !== undefined) this.props.address = fields.address.trim();
    if (fields.city !== undefined) this.props.city = fields.city.trim();
    if (fields.state !== undefined) this.props.state = fields.state.trim();
    if (fields.zipCode !== undefined) this.props.zipCode = fields.zipCode.trim();
    this.props.updatedAt = new Date();
  }

  adjustCredit(amount: number): void {
    const newBalance = this.props.creditBalance + amount;
    if (newBalance < 0) throw new Error('Saldo de credito no puede ser negativo');
    this.props.creditBalance = Math.round(newBalance * 10000) / 10000;
    this.props.updatedAt = new Date();
  }

  deactivate(): void {
    this.props.active = false;
    this.props.updatedAt = new Date();
  }

  activate(): void {
    this.props.active = true;
    this.props.updatedAt = new Date();
  }

  toDTO(): CustomerDTO {
    return {
      id: this.props.id,
      name: this.props.name,
      email: this.props.email,
      phone: this.props.phone,
      type: this.props.type,
      documentType: this.props.documentType,
      documentNumber: this.props.documentNumber,
      address: this.props.address,
      city: this.props.city,
      state: this.props.state,
      zipCode: this.props.zipCode,
      taxId: this.props.taxId,
      creditBalance: this.props.creditBalance,
      notes: this.props.notes,
      active: this.props.active,
      createdBy: this.props.createdBy,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}

export interface CustomerDTO {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  type: CustomerType;
  documentType?: DocumentType;
  documentNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  taxId?: string;
  creditBalance: number;
  notes?: string;
  active: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
