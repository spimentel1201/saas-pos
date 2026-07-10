import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Captura el body crudo de la peticion y lo deja en req.body como Buffer
 * para que el webhook de Stripe pueda verificar la firma HMAC.
 *
 * Fastify por defecto parsea JSON; montamos este middleware SOLO en la ruta
 * del webhook para no afectar el resto de endpoints.
 */
@Injectable()
export class rawBodyMiddleware implements NestMiddleware {
  async use(req: FastifyRequest, _res: FastifyReply, next: () => void): Promise<void> {
    // Fastify ya parsea el body; lo volvemos a serializar a Buffer.
    if (req.body && typeof req.body === 'object') {
      (req as FastifyRequest & { rawBody: Buffer }).rawBody = Buffer.from(JSON.stringify(req.body));
    }
    next();
  }
}
