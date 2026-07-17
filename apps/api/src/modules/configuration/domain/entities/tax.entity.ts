export type TaxType = 'PERCENT' | 'EXEMPT' | 'FIXED';

export interface TaxProps {
  id: string;
  name: string;
  rate: number;
  type: TaxType;
  createdAt: Date;
}

export class Tax {
  private props: TaxProps;

  private constructor(props: TaxProps) {
    this.props = props;
  }

  static create(props: { name: string; rate: number; type: TaxType }): Tax {
    const name = props.name.trim();
    if (!name) throw new Error('Nombre de impuesto es requerido');
    if (props.type === 'PERCENT' && (props.rate < 0 || props.rate > 1)) {
      throw new Error('Tasa debe estar entre 0 y 1 para PERCENT');
    }

    return new Tax({
      id: '',
      name,
      rate: props.rate,
      type: props.type,
      createdAt: new Date(),
    });
  }

  static rehydrate(props: TaxProps): Tax {
    return new Tax(props);
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get rate(): number {
    return this.props.rate;
  }
  get type(): TaxType {
    return this.props.type;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }

  updateName(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Nombre de impuesto es requerido');
    this.props.name = trimmed;
  }

  updateRate(rate: number): void {
    if (this.props.type === 'PERCENT' && (rate < 0 || rate > 1)) {
      throw new Error('Tasa debe estar entre 0 y 1 para PERCENT');
    }
    this.props.rate = rate;
  }

  toDTO(): TaxDTO {
    return {
      id: this.props.id,
      name: this.props.name,
      rate: this.props.rate,
      type: this.props.type,
      createdAt: this.props.createdAt,
    };
  }
}

export interface TaxDTO {
  id: string;
  name: string;
  rate: number;
  type: TaxType;
  createdAt: Date;
}
