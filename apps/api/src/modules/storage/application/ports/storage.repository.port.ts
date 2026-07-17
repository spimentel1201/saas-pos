import { FileCategory, type UploadedFile } from '../../domain/entities/file.entity.js';

export interface UploadFileDto {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  folder: string;
  category: FileCategory;
}

export interface StorageRepositoryPort {
  uploadFile(params: UploadFileDto): Promise<UploadedFile>;
  deleteFile(publicId: string): Promise<void>;
  getSignedUrl(publicId: string, expiresIn?: number): Promise<string>;
  getTemporaryUrl(publicId: string, expiresIn?: number): Promise<string>;
}
