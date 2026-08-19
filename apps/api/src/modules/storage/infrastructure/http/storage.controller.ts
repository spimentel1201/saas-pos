import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentTenant } from '../../../../shared/infrastructure/http/current-tenant.decorator.js';
import { TenantRequired } from '../../../../shared/infrastructure/multi-tenant/tenant-required.decorator.js';
import { StorageUseCases } from '../../application/use-cases/storage.use-case.js';
import { FileCategory } from '../../domain/entities/file.entity.js';

@ApiTags('storage')
@ApiBearerAuth('access-token')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageUseCases: StorageUseCases) {}

  @Post('upload')
  @TenantRequired()
  @HttpCode(201)
  @ApiOperation({ summary: 'Subir archivo' })
  @ApiBody({
    schema: {
      properties: {
        file: {
          type: 'object',
          properties: {
            buffer: { type: 'string' },
            originalName: { type: 'string' },
            mimeType: { type: 'string' },
          },
        },
        category: { type: 'string', enum: Object.values(FileCategory) },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Archivo subido' })
  async uploadFile(
    @CurrentTenant() tenantId: string,
    @Body() body: {
      file: {
        buffer: string;
        originalName: string;
        mimeType: string;
      };
      category?: FileCategory;
    },
  ) {
    if (!body.file) {
      throw new BadRequestException('No file provided');
    }

    const buffer = Buffer.from(body.file.buffer, 'base64');

    const result = await this.storageUseCases.uploadFile({
      buffer,
      originalName: body.file.originalName,
      mimeType: body.file.mimeType,
      tenantId,
      category: body.category || FileCategory.DOCUMENT,
    });

    return result;
  }

  @Post('upload/product/:productId')
  @TenantRequired()
  @HttpCode(201)
  @ApiOperation({ summary: 'Subir imagen de producto' })
  @ApiParam({ name: 'productId', description: 'ID del producto' })
  @ApiBody({
    schema: {
      properties: {
        file: {
          type: 'object',
          properties: {
            buffer: { type: 'string' },
            originalName: { type: 'string' },
            mimeType: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Imagen subida' })
  async uploadProductImage(
    @CurrentTenant() tenantId: string,
    @Param('productId') productId: string,
    @Body() body: {
      file: {
        buffer: string;
        originalName: string;
        mimeType: string;
      };
    },
  ) {
    if (!body.file) {
      throw new BadRequestException('No file provided');
    }

    const buffer = Buffer.from(body.file.buffer, 'base64');

    const result = await this.storageUseCases.uploadProductImage(
      tenantId,
      productId,
      buffer,
      body.file.originalName,
      body.file.mimeType,
    );

    return result;
  }

  @Post('upload/receipt/:saleId')
  @TenantRequired()
  @HttpCode(201)
  @ApiOperation({ summary: 'Subir recibo de venta' })
  @ApiParam({ name: 'saleId', description: 'ID de la venta' })
  @ApiBody({
    schema: {
      properties: {
        file: {
          type: 'object',
          properties: {
            buffer: { type: 'string' },
            originalName: { type: 'string' },
            mimeType: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Recibo subido' })
  async uploadReceipt(
    @CurrentTenant() tenantId: string,
    @Param('saleId') saleId: string,
    @Body() body: {
      file: {
        buffer: string;
        originalName: string;
        mimeType: string;
      };
    },
  ) {
    if (!body.file) {
      throw new BadRequestException('No file provided');
    }

    const buffer = Buffer.from(body.file.buffer, 'base64');

    const result = await this.storageUseCases.uploadReceipt(
      tenantId,
      saleId,
      buffer,
      body.file.originalName,
      body.file.mimeType,
    );

    return result;
  }

  @Delete(':publicId')
  @TenantRequired()
  @HttpCode(200)
  @ApiOperation({ summary: 'Eliminar archivo' })
  @ApiParam({ name: 'publicId', description: 'ID público del archivo' })
  @ApiResponse({ status: 200, description: 'Archivo eliminado' })
  async deleteFile(@Param('publicId') publicId: string) {
    await this.storageUseCases.deleteFile(decodeURIComponent(publicId));
    return { success: true };
  }

  @Get('url/:publicId')
  @TenantRequired()
  @ApiOperation({ summary: 'Obtener URL de archivo' })
  @ApiParam({ name: 'publicId', description: 'ID público del archivo' })
  @ApiQuery({
    name: 'expiresIn',
    required: false,
    type: Number,
    description: 'Tiempo de expiración en segundos',
  })
  @ApiResponse({ status: 200, description: 'URL del archivo' })
  async getFileUrl(@Param('publicId') publicId: string, @Query('expiresIn') expiresIn?: string) {
    const url = await this.storageUseCases.getFileUrl(
      decodeURIComponent(publicId),
      expiresIn ? Number.parseInt(expiresIn, 10) : undefined,
    );

    return { url };
  }

  @Get('temporary/:publicId')
  @TenantRequired()
  @ApiOperation({ summary: 'Obtener URL temporal de archivo' })
  @ApiParam({ name: 'publicId', description: 'ID público del archivo' })
  @ApiQuery({
    name: 'expiresIn',
    required: false,
    type: Number,
    description: 'Tiempo de expiración en segundos',
  })
  @ApiResponse({ status: 200, description: 'URL temporal del archivo' })
  async getTemporaryUrl(
    @Param('publicId') publicId: string,
    @Query('expiresIn') expiresIn?: string,
  ) {
    const url = await this.storageUseCases.getTemporaryUrl(
      decodeURIComponent(publicId),
      expiresIn ? Number.parseInt(expiresIn, 10) : undefined,
    );

    return { url };
  }
}
