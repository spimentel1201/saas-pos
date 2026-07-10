export interface TransformOpts {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'limit';
  quality?: 'auto' | number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  gravity?: 'face' | 'center' | 'auto';
}

export interface SignedUpload {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  preset: string;
}
