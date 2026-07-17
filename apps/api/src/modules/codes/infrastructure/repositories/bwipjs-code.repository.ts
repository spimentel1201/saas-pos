import { Injectable } from '@nestjs/common';
import bwipjs from 'bwip-js';
import QRCode from 'qrcode';
import type {
  CodeRepositoryPort,
  GenerateCodeDto,
} from '../../application/ports/code.repository.port.js';
import { CodeType } from '../../domain/entities/code.entity.js';
import { CodeGenerationError } from '../../domain/errors/code.errors.js';

@Injectable()
export class BwipJsCodeRepository implements CodeRepositoryPort {
  async generateBarcode(params: GenerateCodeDto): Promise<Buffer> {
    try {
      const { type, value, width, height, includetext } = params;

      const bcid = this.mapCodeTypeToBwipJs(type);

      const result = await bwipjs.toBuffer({
        bcid,
        text: value,
        scale: 2,
        height: height ? height / 10 : 15,
        width: width ? width / 10 : 30,
        includetext: includetext ?? true,
        textxalign: 'center',
        monochrome: false,
      });

      return Buffer.from(result);
    } catch (error) {
      throw new CodeGenerationError(
        `Failed to generate barcode: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async generateQR(value: string, size = 256): Promise<Buffer> {
    try {
      const buffer = await QRCode.toBuffer(value, {
        type: 'png',
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return buffer;
    } catch (error) {
      throw new CodeGenerationError(
        `Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async decodeBarcode(_buffer: Buffer): Promise<string> {
    throw new CodeGenerationError('Barcode decoding not implemented yet');
  }

  private mapCodeTypeToBwipJs(type: CodeType): string {
    const mapping: Record<CodeType, string> = {
      [CodeType.EAN13]: 'ean13',
      [CodeType.EAN8]: 'ean8',
      [CodeType.CODE128]: 'code128',
      [CodeType.CODE39]: 'code39',
      [CodeType.QR]: 'qrcode',
      [CodeType.UPC]: 'upca',
      [CodeType.ITF14]: 'itf14',
    };

    return mapping[type] || 'code128';
  }
}
