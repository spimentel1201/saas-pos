import { AsyncLocalStorage } from 'node:async_hooks';
import { BadRequestException } from '@nestjs/common';

export interface TenantInfo {
  id: string;
  slug: string;
  schemaName: string;
  plan: string;
  status: string;
}

/**
 * Almacena por-request el tenant resuelto. Permite recuperarlo desde cualquier
 * capa (incluyendo repositories) sin pasarlo explicitamente por argumentos.
 */
export class TenantContext {
  private static readonly storage = new AsyncLocalStorage<TenantInfo>();

  static run<T>(info: TenantInfo, fn: () => Promise<T>): Promise<T> {
    return this.storage.run(info, fn);
  }

  static get current(): TenantInfo | undefined {
    return this.storage.getStore();
  }

  static get require(): TenantInfo {
    const info = this.storage.getStore();
    if (!info) {
      throw new BadRequestException('No hay tenant activo en el contexto del request');
    }
    return info;
  }

  get id(): string {
    return TenantContext.require.id;
  }

  get slug(): string {
    return TenantContext.require.slug;
  }

  /** Nombre del schema PostgreSQL del tenant (ej: `tenant_abc123`) */
  requireSchemaName(): string {
    return TenantContext.require.schemaName;
  }
}
