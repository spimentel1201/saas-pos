import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentTenant } from '../../../../shared/infrastructure/http/current-tenant.decorator.js';
import { TenantRequired } from '../../../../shared/infrastructure/multi-tenant/tenant-required.decorator.js';
import { StorageUseCases } from '../../application/use-cases/storage.use-case.js';
import { FileCategory } from '../../domain/entities/file.entity.js';

@Controller('api/v1/storage')
export class StorageController {
  constructor(private readonly storageUseCases: StorageUseCases) {}

  @Post('upload')
  @TenantRequired()
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
  async deleteFile(@Param('publicId') publicId: string) {
    await this.storageUseCases.deleteFile(decodeURIComponent(publicId));
    return { success: true };
  }

  @Get('url/:publicId')
  @TenantRequired()
  async getFileUrl(@Param('publicId') publicId: string, @Query('expiresIn') expiresIn?: string) {
    const url = await this.storageUseCases.getFileUrl(
      decodeURIComponent(publicId),
      expiresIn ? Number.parseInt(expiresIn, 10) : undefined,
    );

    return { url };
  }

  @Get('temporary/:publicId')
  @TenantRequired()
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
