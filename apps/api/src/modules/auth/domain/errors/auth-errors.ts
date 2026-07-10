import { ConflictError } from '../../../../shared/domain/errors/domain-error.js';

export class EmailAlreadyRegisteredError extends ConflictError {
  constructor(email: string) {
    super(`El email ${email} ya esta registrado`, 'mailto:already-registered');
  }
}

export class TenantSlugTakenError extends ConflictError {
  constructor(slug: string) {
    super(`El slug "${slug}" ya esta en uso`, 'tenant:slug-taken');
  }
}
