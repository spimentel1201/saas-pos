import { ConflictError, NotFoundError } from '../../../../shared/domain/errors/domain-error.js';

export class TenantNotFoundError extends NotFoundError {
  constructor(identifier: string) {
    super(`Tenant no encontrado: ${identifier}`, 'about:blank');
  }
}

export class BranchLimitExceededError extends ConflictError {
  constructor(plan: string, max: number) {
    super(`Plan ${plan} limita a ${max} sucursales. Upgrade a Growth/Pro.`, 'about:blank');
  }
}

export class ProductLimitExceededError extends ConflictError {
  constructor(plan: string, max: number) {
    super(`Plan ${plan} limita a ${max} productos. Upgrade a Growth/Pro.`, 'about:blank');
  }
}

export class BranchAlreadyExistsError extends ConflictError {
  constructor(code: string) {
    super(`Sucursal con codigo ${code} ya existe`, 'about:blank');
  }
}

export class TaxAlreadyExistsError extends ConflictError {
  constructor(name: string) {
    super(`Impuesto con nombre ${name} ya existe`, 'about:blank');
  }
}
