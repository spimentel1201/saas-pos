export class Money {
  private readonly amount: number; // en centavos (entero)

  private constructor(amount: number) {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new Error('Money debe ser entero no negativo (centavos)');
    }
    this.amount = amount;
  }

  static fromDecimal(decimal: number): Money {
    const cents = Math.round(decimal * 100);
    return new Money(cents);
  }

  static zero(): Money {
    return new Money(0);
  }

  getDecimal(): number {
    return this.amount / 100;
  }

  getCents(): number {
    return this.amount;
  }

  add(other: Money): Money {
    return new Money(this.amount + other.amount);
  }

  subtract(other: Money): Money {
    const result = this.amount - other.amount;
    if (result < 0) throw new Error('Resultado negativo no permitido');
    return new Money(result);
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this.amount * factor));
  }

  toString(): string {
    return (this.amount / 100).toFixed(2);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount;
  }
}