import type { SignOpts, TransformOpts } from '@pos/types';
import { v2 as cloudinary } from 'cloudinary';
import type { StorageProvider, UploadOpts, UploadResult } from './storage-provider.js';

/**
 * CloudinaryProvider - implementacion de StorageProvider sobre Cloudinary.
 *
 * Configuracion (env en apps/api/.env.example):
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *   CLOUDINARY_UPLOAD_PRESET
 *
 * Subidas de frontend: el backend firma los params (signedUploadParams),
 * el navegador hace POST directo a https://api.cloudinary.com/v2/:cloud_name/upload.
 */
export class CloudinaryProvider implements StorageProvider {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async upload(buffer: Buffer, opts: UploadOpts): Promise<UploadResult> {
    const res = await cloudinary.uploader.upload(
      `data:${opts.contentType};base64,${buffer.toString('base64')}`,
      {
        public_id: opts.publicId,
        folder: opts.folder,
        tags: opts.tags,
        resource_type: 'auto',
      },
    );
    return {
      publicId: res.public_id,
      url: res.secure_url,
      bytes: res.bytes,
      format: res.format,
    };
  }

  optimizedUrl(publicId: string, t: TransformOpts): string {
    const parts: string[] = [];
    if (t.width) parts.push(`w_${t.width}`);
    if (t.height) parts.push(`h_${t.height}`);
    if (t.crop) parts.push(`c_${t.crop}`);
    if (t.gravity) parts.push(`g_${t.gravity}`);
    parts.push(`q_${t.quality ?? 'auto'}`);
    parts.push(`f_${t.format ?? 'auto'}`);
    return cloudinary.url(publicId, { transformation: parts.join(',') });
  }

  rawUrl(publicId: string): string {
    return cloudinary.url(publicId, { raw_download: false });
  }

  async delete(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  signedUploadParams(opts: SignOpts) {
    const timestamp = Math.floor(Date.now() / 1000);
    const preset = process.env.CLOUDINARY_UPLOAD_PRESET ?? 'pos-products';
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder: opts.folder, upload_preset: preset },
      process.env.CLOUDINARY_API_SECRET ?? '',
    );
    return {
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY ?? '',
      cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
      folder: opts.folder,
      preset,
    };
  }
}
