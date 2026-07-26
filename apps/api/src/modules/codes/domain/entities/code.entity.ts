export enum CodeType {
  EAN13 = 'EAN13',
  EAN8 = 'EAN8',
  CODE128 = 'CODE128',
  CODE39 = 'CODE39',
  QR = 'QR',
  UPC = 'UPC',
  ITF14 = 'ITF14',
}

export interface CodeConfig {
  type: CodeType;
  value: string;
  width?: number;
  height?: number;
  includetext?: boolean;
  textsize?: number;
}

export interface GeneratedCode {
  type: CodeType;
  value: string;
  buffer: Buffer;
  mimeType: string;
}

export class Code {
  private constructor(
    private readonly _id: string,
    private readonly _type: CodeType,
    private readonly _value: string,
    private readonly _createdAt: Date,
  ) {}

  static create(params: { id: string; type: CodeType; value: string }): Code {
    if (!params.value || params.value.trim().length === 0) {
      throw new Error('Code value cannot be empty');
    }

    if (params.type === CodeType.EAN13 && params.value.length !== 13) {
      throw new Error('EAN13 must be exactly 13 digits');
    }

    if (params.type === CodeType.EAN8 && params.value.length !== 8) {
      throw new Error('EAN8 must be exactly 8 digits');
    }

    if (params.type === CodeType.UPC && params.value.length !== 12) {
      throw new Error('UPC must be exactly 12 digits');
    }

    if (params.type === CodeType.ITF14 && params.value.length !== 14) {
      throw new Error('ITF14 must be exactly 14 digits');
    }

    return new Code(params.id, params.type, params.value.trim(), new Date());
  }

  static rehydrate(params: {
    id: string;
    type: CodeType;
    value: string;
    createdAt: Date;
  }): Code {
    return new Code(params.id, params.type, params.value, params.createdAt);
  }

  get id(): string {
    return this._id;
  }

  get type(): CodeType {
    return this._type;
  }

  get value(): string {
    return this._value;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get mimeType(): string {
    return this._type === CodeType.QR ? 'image/png' : 'image/svg+xml';
  }

  get extension(): string {
    return this._type === CodeType.QR ? 'png' : 'svg';
  }
}
