export class Sku {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value.toUpperCase().trim();
  }

  static create(value: string): Sku {
    const clean = value.toUpperCase().trim();
    if (!/^[A-Z0-9\-]{3,40}$/.test(clean)) {
      throw new Error('SKU inválido: solo A-Z, 0-9, guiones, 3-40 caracteres');
    }
    return new Sku(clean);
  }

  static generate(prefix = 'SKU'): Sku {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    return new Sku(`${prefix}-${id}`);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Sku): boolean {
    return this.value === other.value;
  }
}
