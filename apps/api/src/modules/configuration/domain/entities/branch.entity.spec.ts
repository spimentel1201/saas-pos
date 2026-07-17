import { describe, expect, it } from 'vitest';
import { Branch } from './branch.entity.js';

describe('Branch entity', () => {
  it('creates a branch with valid data', () => {
    const branch = Branch.create({
      name: 'Sucursal Principal',
      code: 'SP001',
      address: 'Av. Principal 123',
      city: 'Lima',
      timezone: 'America/Lima',
    });

    expect(branch.name).toBe('Sucursal Principal');
    expect(branch.code).toBe('SP001');
    expect(branch.address).toBe('Av. Principal 123');
    expect(branch.city).toBe('Lima');
    expect(branch.timezone).toBe('America/Lima');
    expect(branch.active).toBe(true);
  });

  it('trims and uppercases code', () => {
    const branch = Branch.create({
      name: 'Branch',
      code: '  sp002  ',
    });

    expect(branch.code).toBe('SP002');
  });

  it('trims name', () => {
    const branch = Branch.create({
      name: '  Branch Name  ',
      code: 'BN001',
    });

    expect(branch.name).toBe('Branch Name');
  });

  it('uses default timezone', () => {
    const branch = Branch.create({
      name: 'Branch',
      code: 'B001',
    });

    expect(branch.timezone).toBe('America/Lima');
  });

  it('throws if name is empty', () => {
    expect(() =>
      Branch.create({
        name: '',
        code: 'B001',
      }),
    ).toThrow('Nombre de sucursal es requerido');
  });

  it('throws if code is empty', () => {
    expect(() =>
      Branch.create({
        name: 'Branch',
        code: '',
      }),
    ).toThrow('Codigo de sucursal es requerido');
  });

  it('throws if code is only whitespace', () => {
    expect(() =>
      Branch.create({
        name: 'Branch',
        code: '   ',
      }),
    ).toThrow('Codigo de sucursal es requerido');
  });

  it('updateName changes name', () => {
    const branch = Branch.create({
      name: 'Old Name',
      code: 'B001',
    });

    branch.updateName('  New Name  ');
    expect(branch.name).toBe('New Name');
  });

  it('updateName throws if empty', () => {
    const branch = Branch.create({
      name: 'Branch',
      code: 'B001',
    });

    expect(() => branch.updateName('')).toThrow(
      'Nombre de sucursal es requerido',
    );
  });

  it('updateDetails updates multiple fields', () => {
    const branch = Branch.create({
      name: 'Branch',
      code: 'B001',
    });

    branch.updateDetails({
      address: '  New Address  ',
      city: '  Cusco  ',
      timezone: 'America/Bogota',
    });

    expect(branch.address).toBe('New Address');
    expect(branch.city).toBe('Cusco');
    expect(branch.timezone).toBe('America/Bogota');
  });

  it('deactivate sets active to false', () => {
    const branch = Branch.create({
      name: 'Branch',
      code: 'B001',
    });

    branch.deactivate();
    expect(branch.active).toBe(false);
  });

  it('activate sets active to true', () => {
    const branch = Branch.create({
      name: 'Branch',
      code: 'B001',
    });

    branch.deactivate();
    branch.activate();
    expect(branch.active).toBe(true);
  });

  it('rehydrate preserves all properties', () => {
    const now = new Date('2024-01-15');
    const branch = Branch.rehydrate({
      id: 'branch_123',
      name: 'Main Branch',
      code: 'MB001',
      address: 'Main St 123',
      city: 'Lima',
      timezone: 'America/Lima',
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    expect(branch.id).toBe('branch_123');
    expect(branch.code).toBe('MB001');
    expect(branch.createdAt).toBe(now);
  });

  it('toDTO returns plain object', () => {
    const branch = Branch.create({
      name: 'Branch',
      code: 'B001',
    });

    const dto = branch.toDTO();
    expect(dto.name).toBe('Branch');
    expect(dto.code).toBe('B001');
    expect(dto).not.toBeInstanceOf(Branch);
  });
});
