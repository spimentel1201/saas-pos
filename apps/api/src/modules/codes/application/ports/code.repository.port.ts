import { CodeType } from '../../domain/entities/code.entity.js';

export interface GenerateCodeDto {
  type: CodeType;
  value: string;
  width?: number;
  height?: number;
  includetext?: boolean;
}

export interface CodeRepositoryPort {
  generateBarcode(params: GenerateCodeDto): Promise<Buffer>;
  generateQR(value: string, size?: number): Promise<Buffer>;
  decodeBarcode(buffer: Buffer): Promise<string>;
}
