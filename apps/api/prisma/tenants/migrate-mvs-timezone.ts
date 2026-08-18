/**
 * Migracion: recrear materialized views con AT TIME ZONE b.timezone.
 *
 * Uso:
 *   tsx prisma/tenants/migrate-mvs-timezone.ts
 *
 * Lee todos los schemas de tenant (tenant_*), ejecuta DROP + CREATE de las MVs
 * con la nueva definicion timezone-aware. Idempotente: si una MV no existe, la crea.
 *
 * IMPORTANTE: este script es one-shot. Ejecutar una sola vez despues del deploy
 * que agrego AT TIME ZONE a template.sql.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL no definida');
    process.exit(1);
  }

  const migrationPath = resolve(
    import.meta.dirname,
    'migrations',
    '002_refresh_mvs_timezone.sql',
  );
  const migrationSQL = readFileSync(migrationPath, 'utf8');

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    const schemasResult = await client.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'`,
    );
    const schemas = schemasResult.rows.map((r) => r.schema_name as string);

    if (schemas.length === 0) {
      console.log('No se encontraron schemas de tenant.');
      return;
    }

    console.log(`Encontrados ${schemas.length} tenants: ${schemas.join(', ')}`);

    let exitosos = 0;
    let fallidos = 0;

    for (const schema of schemas) {
      process.stdout.write(`  ${schema}... `);
      try {
        await client.query(`SET search_path TO ${schema}`);
        await client.query(migrationSQL);
        console.log('OK');
        exitosos++;
      } catch (err) {
        console.log(`FALLO: ${(err as Error).message}`);
        fallidos++;
      }
    }

    console.log(`\nMigracion completada: ${exitosos} exitosos, ${fallidos} fallidos.`);
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
