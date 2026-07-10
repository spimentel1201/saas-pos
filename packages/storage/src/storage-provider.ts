import type { SignedUpload, TransformOpts } from '@pos/types';

export interface UploadOpts {
  publicId: string;
  contentType: string;
  tags?: string[];
  folder?: string;
}

export interface UploadResult {
  publicId: string;
  url: string;
  bytes: number;
  format: string;
}

export interface SignOpts {
  folder: string;
  tags?: string[];
  maxBytes?: number;
}

/**
 * Abstraccion del proveedor de almacen de archivos.
 *
 * Implementacion actual: CloudinaryProvider (PLAN-MVP-POS-SAAS.md seccion 10).
 * Implementacion v2 prevista: R2Provider / S3Provider, sin tocar el codigo de uso.
 */
export interface StorageProvider {
  upload(buffer: Buffer, opts: UploadOpts): Promise<UploadResult>;
  optimizedUrl(publicId: string, transform: TransformOpts): string;
  rawUrl(publicId: string): string;
  delete(publicId: string): Promise<void>;
  signedUploadParams(opts: SignOpts): SignedUpload;
}
