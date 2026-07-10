import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { PrismaService } from '../prisma/prisma.service.js';
import { TenantContext } from './tenant-context.js';

type FastifyRequestWithRaw = FastifyRequest & {
  raw?: { headers: Record<string, string | string[] | undefined> };
};

/**
 * Resuelve el tenant de cada request y carga su informacion en el
 * AsyncLocalStorage via TenantContext.run().
 *
 *  Resolucion (en orden):
 *   1. Header `X-Tenant-Slug` (para tests y API calls desde workers).
 *   2. Subdomain del Host: `acme.localhost:3001` -> slug `acme`.
 *
 * Si no se resuelve, la request continua SIN tenant (TenantContext vacio).
 * Cada endpoint decide con `@TenantRequired()` o el guard global si lo requiere.
 */
@Injectable()
export class TenantResolverMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: TenantContext,
  ) {
    void this.ctx;
  }

  async use(req: FastifyRequestWithRaw, _res: FastifyReply, next: () => void): Promise<void> {
    const slug = this.resolveSlug(req);
    if (!slug) {
      next();
      return;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        schemaName: true,
        plan: true,
        status: true,
      },
    });

    if (!tenant) {
      next();
      return;
    }

    await TenantContext.run(tenant, () => Promise.resolve(next()));
  }

  private resolveSlug(req: FastifyRequestWithRaw): string | null {
    const headers = req.headers ?? req.raw?.headers;
    const header = headers?.['x-tenant-slug'];
    if (typeof header === 'string' && header.length > 0) {
      return header;
    }
    const host = (headers?.host as string) || '';
    const baseDomain = process.env.TENANT_BASE_DOMAIN || 'localhost';
    if (host.endsWith(baseDomain) && host !== baseDomain) {
      const sub = host.slice(0, -baseDomain.length - 1);
      if (sub && !sub.includes('.')) {
        return sub;
      }
    }
    return null;
  }
}
