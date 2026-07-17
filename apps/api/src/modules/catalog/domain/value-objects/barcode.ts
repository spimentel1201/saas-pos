export class Barcode {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value.trim();
  }

  static create(value: string): Barcode {
    const clean = value.trim();
    // EAN-13, EAN-8, UPC-A, Code128, QR data
    if (!/^(\d{8}|\d{12}|\d{13}|[A-Za-z0-9\-]{1,50})$/.test(clean)) {
      throw new Error('Código de barras inválido');
    }
    return new Barcode(clean);
  }

  toString(): string {
    return this.value;
  }

  getType(): 'EAN13' | 'EAN8' | 'UPC' | 'CODE128' | 'QR' {
    if (/^\d{13}$/.test(this.value)) return 'EAN13';
    if (/^\d{8}$/.test(this.value)) return 'EAN8';
    if (/^\d{12}$/.test(this.value)) return 'UPC';
    if (/^[A-Za-z0-9\-]+$/.test(this.value)) return 'CODE128';
    return 'QR';
  }

  equals(other: Barcode): boolean {
    return this.value === other.value;
  }
}
