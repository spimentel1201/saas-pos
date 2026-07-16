import { ulid } from 'ulid';

export interface BarcodeData {
  productId: string;
  productName: string;
  sku: string;
  barcode?: string;
  type: 'CODE128' | 'EAN13' | 'EAN8' | 'UPCA' | 'QR';
}

export interface LabelTemplate {
  id: string;
  name: string;
  width: number;
  height: number;
  margin: number;
  columns: number;
  rows: number;
  fontSize: number;
  showPrice: boolean;
  showName: boolean;
  showSku: boolean;
}

export const DEFAULT_LABEL_TEMPLATE: LabelTemplate = {
  id: 'default',
  name: 'Etiqueta estándar 50x25mm',
  width: 50,
  height: 25,
  margin: 2,
  columns: 2,
  rows: 5,
  fontSize: 8,
  showPrice: true,
  showName: true,
  showSku: true,
};

export interface CodeGenerationOptions {
  format: 'png' | 'svg';
  width?: number;
  height?: number;
  margin?: number;
  color?: string;
  background?: string;
}

export const DEFAULT_CODE_OPTIONS: CodeGenerationOptions = {
  format: 'png',
  width: 300,
  height: 150,
  margin: 10,
  color: '#000000',
  background: '#ffffff',
};

export interface QRCodeData {
  productId: string;
  tenantSlug: string;
  slug: string;
  signature: string;
}