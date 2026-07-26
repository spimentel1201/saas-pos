import { BadRequestException, Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { Public } from '../../../../shared/infrastructure/http/public.decorator.js';
import { CodeUseCases } from '../../application/use-cases/code.use-case.js';
import { CodeType } from '../../domain/entities/code.entity.js';

@Public()
@Controller('codes')
export class CodeController {
  constructor(private readonly codeUseCases: CodeUseCases) {}

  @Get('generate/:type/:value')
  async generateCode(
    @Param('type') type: string,
    @Param('value') value: string,
    @Query('width') width?: string,
    @Query('height') height?: string,
    @Query('includetext') includetext?: string,
    @Res({ passthrough: true }) res?: FastifyReply,
  ) {
    const codeType = type.toUpperCase() as CodeType;

    if (!Object.values(CodeType).includes(codeType)) {
      throw new BadRequestException(
        `Invalid code type: ${type}. Valid types: ${Object.values(CodeType).join(', ')}`,
      );
    }

    const result = await this.codeUseCases.generateCode({
      type: codeType,
      value,
      width: width ? Number.parseInt(width, 10) : undefined,
      height: height ? Number.parseInt(height, 10) : undefined,
      includetext: includetext === 'true',
    });

    res?.header('Content-Type', result.mimeType);
    res?.header('Cache-Control', 'public, max-age=86400');
    return result.buffer;
  }

  @Get('generate/barcode/:value')
  async generateBarcode(
    @Param('value') value: string,
    @Query('type') type = 'CODE128',
    @Query('width') width?: string,
    @Query('height') height?: string,
    @Query('includetext') includetext?: string,
    @Res({ passthrough: true }) res?: FastifyReply,
  ) {
    const result = await this.codeUseCases.generateCode({
      type: type.toUpperCase() as CodeType,
      value,
      width: width ? Number.parseInt(width, 10) : undefined,
      height: height ? Number.parseInt(height, 10) : undefined,
      includetext: includetext === 'true',
    });

    res?.header('Content-Type', result.mimeType);
    res?.header('Cache-Control', 'public, max-age=86400');
    return result.buffer;
  }

  @Get('generate/qr/:value')
  async generateQR(
    @Param('value') value: string,
    @Query('size') size?: string,
    @Res({ passthrough: true }) res?: FastifyReply,
  ) {
    const result = await this.codeUseCases.generateQR(
      value,
      size ? Number.parseInt(size, 10) : undefined,
    );

    res?.header('Content-Type', 'image/png');
    res?.header('Cache-Control', 'public, max-age=86400');
    return result.buffer;
  }

  @Get('types')
  getSupportedTypes() {
    return {
      types: this.codeUseCases.getSupportedTypes(),
    };
  }
}
