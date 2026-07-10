/**
 * Script para crear el schema SQL de un nuevo tenant.
 *
 * Uso:
 *   tsx prisma/tenants/create-schema.ts <schema_name>
 *
 * Pasos:
 *  1. Lee `template.sql` y sustituye :schema_name por el nombre recibido.
 *  2. Ejecuta el SQL contra la DATABASE_URL usando `pg`.
 *  3. Opcionalmente corre los seeds por defecto (impuesto, categoria raiz).
 *
 * En produccion, este script es invocado desde el modulo `tenants` de NestJS
 * dentro de la alta onboarding de un comercio.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';

async function main(): Promise<void> {
  const schemaName = process.argv[2];
  if (!schemaName || !/^tenant_[a-z0-9_]+$/i.test(schemaName)) {
    console.error('Usage: create-schema.ts <schema_name>');
    console.error('Schema name must match /^tenant_[a-z0-9_]+$/i');
    process.exit(1);
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL no definida');
    process.exit(1);
  }

  const templatePath = resolve(import.meta.dirname, 'template.sql');
  const template = readFileSync(templatePath, 'utf8');

  // Reemplazo simple de la variable psql-style :schema_name
  // IMPORTANTE: schema_name ya fue validado contra regex estricta (no inyeccion SQL).
  const sql = template.replaceAll(':schema_name', schemaName);

  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    console.log(`Creando schema "${schemaName}"...`);
    await client.query(sql);
    console.log('OK');
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
