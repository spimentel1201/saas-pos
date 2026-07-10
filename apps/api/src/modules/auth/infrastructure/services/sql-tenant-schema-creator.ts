import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Injectable, Logger } from '@nestjs/common';
import pg from 'pg';
import type { TenantSchemaCreatorPort } from '../../application/ports/tenant-schema-creator.port.js';

/**
 * SqlTenantSchemaCreator - aplica `prisma/tenants/template.sql` a un schema nuevo.
 * Implementacion del puerto definido en application/.
 *
 * El nombre del schema se valida contra /^tenant_[a-z0-9_]+$/i en create-schema.ts
 * Aqui confiamos en que viene saneado (lo genera SignupUseCase con ulid + slug).
 */
@Injectable()
export class SqlTenantSchemaCreator implements TenantSchemaCreatorPort {
  private readonly logger = new Logger('TenantSchemaCreator');

  async create(schemaName: string): Promise<void> {
    if (!/^tenant_[a-z0-9_]+$/i.test(schemaName)) {
      throw new Error(`schemaName invalido: ${schemaName}`);
    }
    const templatePath = this.resolveTemplatePath();
    const template = readFileSync(templatePath, 'utf8');
    const sql = template.replaceAll(':schema_name', schemaName);

    const client = new pg.Client({
      connectionString:
        process.env.DATABASE_URL ??
        'postgresql://postgres:postgres@localhost:5432/pos_saas?schema=public',
    });
    await client.connect();
    try {
      await client.query(sql);
      this.logger.log(`Schema ${schemaName} creado OK`);
    } finally {
      await client.end();
    }
  }

  private resolveTemplatePath(): string {
    // En dev (tsx) import.meta.url apunta a src/, en prod (node dist/) apunta a dist/
    // Subimos 5 niveles desde dist/modules/auth/infrastructure/services/ para llegar a apps/api/
    const here = fileURLToPath(import.meta.url);
    const apiRoot = resolve(here, '..', '..', '..', '..', '..');
    const templatePath = resolve(apiRoot, 'prisma', 'tenants', 'template.sql');
    this.logger.log(`Template path resolved to: ${templatePath}`);
    return templatePath;
  }
}
