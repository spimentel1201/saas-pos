export class CustomerNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Cliente no encontrado: ${identifier}`);
    this.name = 'CustomerNotFoundError';
  }
}

export class CustomerConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CustomerConflictError';
  }
}

export class InvalidDocumentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDocumentError';
  }
}
