/**
 * Filtro global de excepciones → RFC7807 Problem Details.
 *
 * Estandariza el formato de errores JSON de la API en:
 *   { "type": "about:blank", "title": "Not Found", "status": 404,
 *     "detail": "...", "instance": "/api/v1/products/123" }
 *
 * Errores de dominio conocidos deben heredar de `DomainError` (ver shared/domain)
 * y exponer `toProblemDetail()`.
 */
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<FastifyReply>();
    const req = ctx.getRequest<FastifyRequest>();

    const problem = this.toProblemDetail(exception, req);

    if (problem.status >= 500) {
      this.logger.error(exception);
    }

    res.status(problem.status).header('Content-Type', 'application/problem+json').send(problem);
  }

  private toProblemDetail(exception: unknown, req: FastifyRequest): ProblemDetail {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const title = exception.name;

      if (typeof response === 'object' && response !== null) {
        const r = response as Record<string, unknown>;
        if (r.message !== undefined) {
          return {
            type: 'about:blank',
            title: typeof r.message === 'string' ? r.message : title,
            status,
            detail: typeof r.message === 'string' ? r.message : (r.error as string),
            instance: req.url,
            errors: r.errors as unknown,
          };
        }
      }
      return {
        type: 'about:blank',
        title,
        status,
        detail: typeof response === 'string' ? response : exception.message,
        instance: req.url,
      };
    }

    return {
      type: 'about:blank',
      title: 'Internal Server Error',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      detail: process.env.NODE_ENV === 'production' ? undefined : (exception as Error)?.message,
      instance: req.url,
    };
  }
}
