import { Injectable, Logger } from '@nestjs/common';

/**
 * LoggerService - wrapper sobre el Logger de NestJS que añade correlation ID
 * (resuelto por el middleware HTTP. Ver shared/infrastructure/http/correlation).
 *
 * En v2 se puede cambiar a pino-http con transport a loki/seq sin tocar codigo
 * de uso.
 */
@Injectable()
export class LoggerService extends Logger {
  constructor(context: string) {
    super(context);
  }

  correlationId(correlationId: string, message: string, context?: string): void {
    super.log(`[${correlationId}] ${message}`, context);
  }
}
