/**
 * Migracion: agrega product_name y product_sku a sale_items en tenants existentes.
 *
 * Uso:
 *   tsx prisma/tenants/migrate-product-name.ts
 *
 * Lee todos los schemas de tenant (tenant_*) y ejecuta el ALTER TABLE.
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
    '001_add_product_name_to_sale_items.sql',
  );
  const migrationSQL = readFileSync(migrationPath, 'utf8');

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    // Obtener todos los schemas de tenant
    const schemasResult = await client.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'`,
    );
    const schemas = schemasResult.rows.map((r) => r.schema_name as string);

    if (schemas.length === 0) {
      console.log('No se encontraron schemas de tenant.');
      return;
    }

    console.log(`Encontrados ${schemas.length} tenants: ${schemas.join(', ')}`);

    for (const schema of schemas) {
      console.log(`Migrando "${schema}"...`);
      await client.query(`SET search_path TO ${schema}`);
      await client.query(migrationSQL);
      console.log(`  OK`);
    }

    console.log('Migracion completada.');
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
