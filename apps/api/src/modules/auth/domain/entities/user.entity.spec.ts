import { describe, expect, it } from 'vitest';
import { User } from './user.entity.js';

describe('User entity', () => {
  it('crea con email normalizado', () => {
    const u = User.create({
      id: 'u_1',
      email: '  Juan@Example.COM ',
      name: '  Juan  ',
      passwordHash: 'hash',
    });
    expect(u.email).toBe('juan@example.com');
    expect(u.name).toBe('Juan');
    expect(u.emailVerified).toBeNull();
  });

  it('lanza si email invalido', () => {
    expect(() =>
      User.create({
        id: 'u_2',
        email: 'no-email',
        name: 'X',
        passwordHash: 'hash',
      }),
    ).toThrow();
  });

  it('rehydrate preserva metadatos', () => {
    const createdAt = new Date('2024-01-01');
    const updatedAt = new Date('2024-06-01');
    const u = User.rehydrate({
      id: 'u_3',
      email: 'a@b.com',
      name: 'Test',
      passwordHash: 'hash',
      emailVerified: createdAt,
      lastLoginAt: updatedAt,
      createdAt,
      updatedAt,
    });
    expect(u.emailVerified).toEqual(createdAt);
    expect(u.lastLoginAt).toEqual(updatedAt);
  });
});
