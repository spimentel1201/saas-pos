/**
 * Entidad de dominio User. NO depende de Prisma ni NestJS.
 * Representa al usuario global (multi-tenant) con sus invariantes.
 */
export class User {
  readonly id: string;
  email: string;
  name: string;
  passwordHash: string;
  emailVerified: Date | null;
  lastLoginAt: Date | null;
  readonly createdAt: Date;
  updatedAt: Date;

  private constructor(props: {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    emailVerified: Date | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = props.id;
    this.email = props.email;
    this.name = props.name;
    this.passwordHash = props.passwordHash;
    this.emailVerified = props.emailVerified;
    this.lastLoginAt = props.lastLoginAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(props: {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): User {
    const email = props.email.trim().toLowerCase();
    const name = props.name.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Email invalido');
    }
    return new User({
      id: props.id,
      email,
      name,
      passwordHash: props.passwordHash,
      emailVerified: null,
      lastLoginAt: null,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  /**
   * Reconstruye una entidad User desde su representacion persistida.
   * Usado por el repository para hidratar registros de la base de datos.
   */
  static rehydrate(props: {
    id: string;
    email: string;
    name: string;
    passwordHash: string;
    emailVerified: Date | null;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(props);
  }

  markEmailVerified(): void {
    this.emailVerified = new Date();
  }

  touchLastLogin(): void {
    this.lastLoginAt = new Date();
  }
}
