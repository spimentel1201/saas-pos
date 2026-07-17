import { DomainError } from '../../../../shared/domain/errors/domain-error.js';

export class CodeGenerationError extends DomainError {
  constructor(message: string) {
    super({
      type: 'about:blank',
      title: 'Code Generation Error',
      status: 422,
      detail: message,
    });
  }
}

export class InvalidCodeTypeError extends DomainError {
  constructor(type: string) {
    super({
      type: 'about:blank',
      title: 'Invalid Code Type',
      status: 400,
      detail: `Invalid code type: ${type}`,
    });
  }
}

export class InvalidCodeValueError extends DomainError {
  constructor(value: string, type: string) {
    super({
      type: 'about:blank',
      title: 'Invalid Code Value',
      status: 400,
      detail: `Invalid value "${value}" for code type ${type}`,
    });
  }
}
