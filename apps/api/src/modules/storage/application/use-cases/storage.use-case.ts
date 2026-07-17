import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { FileCategory } from '../../domain/entities/file.entity.js';
import { FileDeleteError, FileUploadError } from '../../domain/errors/storage.errors.js';
import { STORAGE_REPOSITORY } from '../../storage.tokens.js';
import type { StorageRepositoryPort } from '../ports/storage.repository.port.js';

export interface UploadFileRequest {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  tenantId: string;
  category: FileCategory;
}

export interface UploadFileResponse {
  id: string;
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
}

@Injectable()
export class StorageUseCases {
  constructor(
    @Inject(STORAGE_REPOSITORY)
    private readonly storageRepository: StorageRepositoryPort,
  ) {}

  async uploadFile(request: UploadFileRequest): Promise<UploadFileResponse> {
    const { buffer, originalName, mimeType, tenantId, category } = request;

    const folder = this.buildFolder(tenantId, category);
    const fileId = randomUUID();

    try {
      const uploadedFile = await this.storageRepository.uploadFile({
        buffer,
        originalName,
        mimeType,
        folder,
        category,
      });

      return {
        id: fileId,
        url: uploadedFile.url,
        originalName: uploadedFile.originalName,
        size: uploadedFile.size,
        mimeType: uploadedFile.mimeType,
      };
    } catch (error) {
      throw new FileUploadError(
        `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await this.storageRepository.deleteFile(publicId);
    } catch (error) {
      throw new FileDeleteError(
        `Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getFileUrl(publicId: string, expiresIn?: number): Promise<string> {
    return this.storageRepository.getSignedUrl(publicId, expiresIn);
  }

  async getTemporaryUrl(publicId: string, expiresIn?: number): Promise<string> {
    return this.storageRepository.getTemporaryUrl(publicId, expiresIn);
  }

  async uploadProductImage(
    tenantId: string,
    _productId: string,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<UploadFileResponse> {
    return this.uploadFile({
      buffer,
      originalName,
      mimeType,
      tenantId,
      category: FileCategory.PRODUCT_IMAGE,
    });
  }

  async uploadReceipt(
    tenantId: string,
    _saleId: string,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<UploadFileResponse> {
    return this.uploadFile({
      buffer,
      originalName,
      mimeType,
      tenantId,
      category: FileCategory.RECEIPT,
    });
  }

  private buildFolder(tenantId: string, category: FileCategory): string {
    const categoryFolders: Record<FileCategory, string> = {
      [FileCategory.PRODUCT_IMAGE]: 'products',
      [FileCategory.RECEIPT]: 'receipts',
      [FileCategory.REPORT]: 'reports',
      [FileCategory.AVATAR]: 'avatars',
      [FileCategory.DOCUMENT]: 'documents',
    };

    return `tenants/${tenantId}/${categoryFolders[category]}`;
  }
}
