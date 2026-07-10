import { HttpException, HttpStatus } from '@nestjs/common';

export interface ProblemDetailLike {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: unknown;
}

/**
 * Error base de dominio. Lanzado desde `domain/` o `application/`.
 * Lo captura AllExceptionsFilter y lo convierte a RFC7807.
 */
export abstract class DomainError extends HttpException {
  constructor(
    public readonly problem: ProblemDetailLike,
    status: HttpStatus = HttpStatus.UNPROCESSABLE_ENTITY,
  ) {
    super(problem, status);
  }
}

export class NotFoundError extends DomainError {
  constructor(detail: string, type = 'about:blank') {
    super({ type, title: 'Not Found', status: 404, detail }, HttpStatus.NOT_FOUND);
  }
}

export class ConflictError extends DomainError {
  constructor(detail: string, type = 'about:blank') {
    super({ type, title: 'Conflict', status: 409, detail }, HttpStatus.CONFLICT);
  }
}

export class ValidationError extends DomainError {
  constructor(detail: string, errors?: unknown) {
    super(
      { type: 'about:blank', title: 'Validation Error', status: 422, detail, errors },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
