/**
 * Hash de password como value object: encapsula el algoritmo de hashing.
 * Cuando quieras cambiar de bcrypt a argon2 solo se toca aqui.
 */
export interface PasswordHasherPort {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}
