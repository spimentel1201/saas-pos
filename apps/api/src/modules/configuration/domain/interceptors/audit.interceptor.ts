import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service.js';
import { AUDIT_KEY, type AuditMetadata } from '../decorators/audit.decorator.js';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const auditMeta = this.reflector.get<AuditMetadata>(AUDIT_KEY, context.getHandler());
    if (!auditMeta) return next.handle();

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.tenantId;

    return next.handle().pipe(
      tap(async () => {
        try {
          await this.prisma.auditLog.create({
            data: {
              tenantId: tenantId ?? null,
              userId: user?.sub ?? null,
              action: auditMeta.action,
              entity: auditMeta.entity,
              ip: request.ip ?? null,
              userAgent: request.headers?.['user-agent'] ?? null,
            },
          });
        } catch {
          // Audit log failures should not break the request
        }
      }),
    );
  }
}
