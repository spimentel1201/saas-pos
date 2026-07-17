export interface BranchProps {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  timezone: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Branch {
  private props: BranchProps;

  private constructor(props: BranchProps) {
    this.props = props;
  }

  static create(props: {
    name: string;
    code: string;
    address?: string;
    city?: string;
    timezone?: string;
  }): Branch {
    const name = props.name.trim();
    const code = props.code.trim().toUpperCase();
    if (!name) throw new Error('Nombre de sucursal es requerido');
    if (!code) throw new Error('Codigo de sucursal es requerido');

    const now = new Date();
    return new Branch({
      id: '',
      name,
      code,
      address: props.address?.trim(),
      city: props.city?.trim(),
      timezone: props.timezone ?? 'America/Lima',
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(props: BranchProps): Branch {
    return new Branch(props);
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get code(): string {
    return this.props.code;
  }
  get address(): string | undefined {
    return this.props.address;
  }
  get city(): string | undefined {
    return this.props.city;
  }
  get timezone(): string {
    return this.props.timezone;
  }
  get active(): boolean {
    return this.props.active;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateName(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Nombre de sucursal es requerido');
    this.props.name = trimmed;
    this.props.updatedAt = new Date();
  }

  updateDetails(fields: { address?: string; city?: string; timezone?: string }): void {
    if (fields.address !== undefined) this.props.address = fields.address.trim();
    if (fields.city !== undefined) this.props.city = fields.city.trim();
    if (fields.timezone !== undefined) this.props.timezone = fields.timezone;
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

  toDTO(): BranchDTO {
    return {
      id: this.props.id,
      name: this.props.name,
      code: this.props.code,
      address: this.props.address,
      city: this.props.city,
      timezone: this.props.timezone,
      active: this.props.active,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}

export interface BranchDTO {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  timezone: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}
