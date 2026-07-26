import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiOptions, UploadApiResponse } from 'cloudinary';
import type {
  StorageRepositoryPort,
  UploadFileDto,
} from '../../application/ports/storage.repository.port.js';
import { type UploadedFile } from '../../domain/entities/file.entity.js';
import { FileDeleteError, FileUploadError } from '../../domain/errors/storage.errors.js';

@Injectable()
export class CloudinaryStorageRepository implements StorageRepositoryPort {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(params: UploadFileDto): Promise<UploadedFile> {
    try {
      const { buffer, originalName, mimeType, folder, category } = params;

      const base64 = buffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64}`;

      const options: UploadApiOptions = {
        folder,
        resource_type: 'auto',
        public_id: `${category}_${Date.now()}`,
        unique_filename: true,
        overwrite: false,
      };

      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(dataUri, options, (error, uploadResult) => {
          if (error) reject(error);
          else if (uploadResult) resolve(uploadResult);
          else reject(new Error('No result from Cloudinary'));
        });
      });

      return {
        id: result.public_id,
        originalName: originalName,
        mimeType: result.format === 'jpg' ? 'image/jpeg' : `image/${result.format}`,
        size: result.bytes,
        url: result.secure_url,
        publicId: result.public_id,
        folder: folder,
        category: category,
        createdAt: new Date(result.created_at),
      };
    } catch (error) {
      throw new FileUploadError(
        `Cloudinary upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async deleteFile(publicId: string): Promise<void> {
    try {
      await new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        });
      });
    } catch (error) {
      throw new FileDeleteError(
        `Cloudinary delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getSignedUrl(publicId: string, expiresIn = 3600): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000) + expiresIn;

    const url = cloudinary.url(publicId, {
      type: 'authenticated',
      sign_url: true,
      secure: true,
      expires_at: timestamp,
    });

    return url;
  }

  async getTemporaryUrl(publicId: string, expiresIn = 3600): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000) + expiresIn;

    const url = cloudinary.url(publicId, {
      type: 'upload',
      sign_url: true,
      secure: true,
      expires_at: timestamp,
    });

    return url;
  }
}
