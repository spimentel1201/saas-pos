export interface TenantSettingProps {
  id: number;
  key: string;
  value: unknown;
  updatedAt: Date;
}

export class TenantSetting {
  private props: TenantSettingProps;

  private constructor(props: TenantSettingProps) {
    this.props = props;
  }

  static create(key: string, value: unknown): TenantSetting {
    if (!key) throw new Error('Key es requerida');
    return new TenantSetting({
      id: 0,
      key,
      value,
      updatedAt: new Date(),
    });
  }

  static rehydrate(props: TenantSettingProps): TenantSetting {
    return new TenantSetting(props);
  }

  get id(): number {
    return this.props.id;
  }
  get key(): string {
    return this.props.key;
  }
  get value(): unknown {
    return this.props.value;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateValue(value: unknown): void {
    this.props.value = value;
    this.props.updatedAt = new Date();
  }

  toDTO(): TenantSettingDTO {
    return {
      id: this.props.id,
      key: this.props.key,
      value: this.props.value,
      updatedAt: this.props.updatedAt,
    };
  }
}

export interface TenantSettingDTO {
  id: number;
  key: string;
  value: unknown;
  updatedAt: Date;
}
