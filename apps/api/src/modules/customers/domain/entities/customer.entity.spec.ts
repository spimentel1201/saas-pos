import { describe, expect, it } from 'vitest';
import { Customer } from './customer.entity.js';

describe('Customer entity', () => {
  it('creates a customer with valid data', () => {
    const customer = Customer.create({
      name: 'Juan Perez',
      email: 'juan@example.com',
      phone: '999999999',
      type: 'INDIVIDUAL',
      documentType: 'DNI',
      documentNumber: '12345678',
    });

    expect(customer.name).toBe('Juan Perez');
    expect(customer.email).toBe('juan@example.com');
    expect(customer.phone).toBe('999999999');
    expect(customer.type).toBe('INDIVIDUAL');
    expect(customer.documentType).toBe('DNI');
    expect(customer.documentNumber).toBe('12345678');
    expect(customer.active).toBe(true);
    expect(customer.creditBalance).toBe(0);
  });

  it('trims and normalizes email', () => {
    const customer = Customer.create({
      name: '  Juan Perez  ',
      email: '  Juan@Example.COM  ',
    });

    expect(customer.name).toBe('Juan Perez');
    expect(customer.email).toBe('juan@example.com');
  });

  it('throws if name is empty', () => {
    expect(() =>
      Customer.create({
        name: '',
      }),
    ).toThrow('Nombre del cliente es requerido');
  });

  it('throws if name is only whitespace', () => {
    expect(() =>
      Customer.create({
        name: '   ',
      }),
    ).toThrow('Nombre del cliente es requerido');
  });

  it('validates DNI must be 8 digits', () => {
    expect(() =>
      Customer.create({
        name: 'Juan',
        type: 'INDIVIDUAL',
        documentType: 'DNI',
        documentNumber: '1234567',
      }),
    ).toThrow('DNI debe tener 8 digitos');
  });

  it('validates RUC must be 11 digits', () => {
    expect(() =>
      Customer.create({
        name: 'Empresa SAC',
        type: 'BUSINESS',
        documentType: 'RUC',
        documentNumber: '1234567890',
      }),
    ).toThrow('RUC debe tener 11 digitos');
  });

  it('allows valid DNI', () => {
    const customer = Customer.create({
      name: 'Juan',
      type: 'INDIVIDUAL',
      documentType: 'DNI',
      documentNumber: '12345678',
    });

    expect(customer.documentNumber).toBe('12345678');
  });

  it('allows valid RUC', () => {
    const customer = Customer.create({
      name: 'Empresa SAC',
      type: 'BUSINESS',
      documentType: 'RUC',
      documentNumber: '20123456789',
    });

    expect(customer.documentNumber).toBe('20123456789');
  });

  it('allows CE and PASSPORT without length validation', () => {
    const customer1 = Customer.create({
      name: 'Foreign Customer',
      documentType: 'CE',
      documentNumber: '12345',
    });

    const customer2 = Customer.create({
      name: 'Foreign Customer 2',
      documentType: 'PASSPORT',
      documentNumber: 'AB1234567',
    });

    expect(customer1.documentNumber).toBe('12345');
    expect(customer2.documentNumber).toBe('AB1234567');
  });

  it('adjustCredit increases balance', () => {
    const customer = Customer.create({
      name: 'Juan',
    });

    customer.adjustCredit(100);
    expect(customer.creditBalance).toBe(100);

    customer.adjustCredit(50);
    expect(customer.creditBalance).toBe(150);
  });

  it('adjustCredit decreases balance', () => {
    const customer = Customer.create({
      name: 'Juan',
    });

    customer.adjustCredit(100);
    customer.adjustCredit(-50);
    expect(customer.creditBalance).toBe(50);
  });

  it('adjustCredit throws if result would be negative', () => {
    const customer = Customer.create({
      name: 'Juan',
    });

    customer.adjustCredit(100);
    expect(() => customer.adjustCredit(-150)).toThrow(
      'Saldo de credito no puede ser negativo',
    );
  });

  it('deactivate sets active to false', () => {
    const customer = Customer.create({
      name: 'Juan',
    });

    customer.deactivate();
    expect(customer.active).toBe(false);
  });

  it('activate sets active to true', () => {
    const customer = Customer.create({
      name: 'Juan',
    });

    customer.deactivate();
    customer.activate();
    expect(customer.active).toBe(true);
  });

  it('updateName changes name', () => {
    const customer = Customer.create({
      name: 'Juan',
    });

    customer.updateName('  Juan Perez  ');
    expect(customer.name).toBe('Juan Perez');
  });

  it('updateName throws if empty', () => {
    const customer = Customer.create({
      name: 'Juan',
    });

    expect(() => customer.updateName('')).toThrow(
      'Nombre del cliente es requerido',
    );
  });

  it('updateContact updates multiple fields', () => {
    const customer = Customer.create({
      name: 'Juan',
    });

    customer.updateContact({
      email: '  NEW@EMAIL.COM  ',
      phone: '888888888',
      address: '  Main St 123  ',
    });

    expect(customer.email).toBe('new@email.com');
    expect(customer.phone).toBe('888888888');
    expect(customer.address).toBe('Main St 123');
  });

  it('rehydrate preserves all properties', () => {
    const now = new Date('2024-01-15');
    const customer = Customer.rehydrate({
      id: 'cust_123',
      name: 'Juan',
      email: 'juan@test.com',
      phone: '999999999',
      type: 'BUSINESS',
      documentType: 'RUC',
      documentNumber: '20123456789',
      address: 'Main St',
      city: 'Lima',
      state: 'Lima',
      zipCode: '15001',
      taxId: '20123456789',
      creditBalance: 500,
      notes: 'VIP customer',
      active: true,
      createdBy: 'user_123',
      createdAt: now,
      updatedAt: now,
    });

    expect(customer.id).toBe('cust_123');
    expect(customer.creditBalance).toBe(500);
    expect(customer.createdAt).toBe(now);
  });

  it('toDTO returns plain object', () => {
    const customer = Customer.create({
      name: 'Juan',
      email: 'juan@test.com',
    });

    const dto = customer.toDTO();
    expect(dto.name).toBe('Juan');
    expect(dto.email).toBe('juan@test.com');
    expect(dto).not.toBeInstanceOf(Customer);
  });
});
