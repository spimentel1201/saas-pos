import { Inject, Injectable } from '@nestjs/common';
import { CODE_REPOSITORY } from '../../codes.tokens.js';
import { CodeType } from '../../domain/entities/code.entity.js';
import { CodeGenerationError, InvalidCodeTypeError } from '../../domain/errors/code.errors.js';
import type { CodeRepositoryPort, GenerateCodeDto } from '../ports/code.repository.port.js';

export interface GenerateCodeRequest {
  type: CodeType;
  value: string;
  width?: number;
  height?: number;
  includetext?: boolean;
}

export interface GenerateCodeResponse {
  type: CodeType;
  value: string;
  buffer: Buffer;
  mimeType: string;
  extension: string;
}

@Injectable()
export class CodeUseCases {
  constructor(
    @Inject(CODE_REPOSITORY)
    private readonly codeRepository: CodeRepositoryPort,
  ) {}

  async generateCode(request: GenerateCodeRequest): Promise<GenerateCodeResponse> {
    const { type, value, width, height, includetext } = request;

    if (!Object.values(CodeType).includes(type)) {
      throw new InvalidCodeTypeError(type);
    }

    try {
      let buffer: Buffer;

      if (type === CodeType.QR) {
        buffer = await this.codeRepository.generateQR(value, width || 256);
      } else {
        const dto: GenerateCodeDto = {
          type,
          value,
          width: width || 300,
          height: height || 150,
          includetext: includetext ?? true,
        };
        buffer = await this.codeRepository.generateBarcode(dto);
      }

      return {
        type,
        value,
        buffer,
        mimeType: type === CodeType.QR ? 'image/png' : 'image/svg+xml',
        extension: type === CodeType.QR ? 'png' : 'svg',
      };
    } catch (error) {
      if (error instanceof InvalidCodeTypeError) {
        throw error;
      }
      throw new CodeGenerationError(
        `Failed to generate ${type} code: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async generateProductCode(
    sku: string,
    type: CodeType = CodeType.EAN13,
  ): Promise<GenerateCodeResponse> {
    return this.generateCode({ type, value: sku });
  }

  async generateProductQR(sku: string, size?: number): Promise<GenerateCodeResponse> {
    return this.generateCode({ type: CodeType.QR, value: sku, width: size });
  }

  async generateQR(value: string, size?: number): Promise<GenerateCodeResponse> {
    return this.generateCode({ type: CodeType.QR, value, width: size });
  }

  getSupportedTypes(): CodeType[] {
    return Object.values(CodeType);
  }
}
