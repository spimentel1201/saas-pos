import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';

function loadEnv() {
  const envPath = resolve(import.meta.dirname, '..', '.env');
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    process.env[key] = value;
  }
}

async function main() {
  loadEnv();
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not defined');

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    // Drop all tenant schemas
    const schemas = await client.query(
      `SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'`
    );
    for (const row of schemas.rows) {
      console.log(`Dropping schema: ${row.schema_name}`);
      await client.query(`DROP SCHEMA IF EXISTS ${row.schema_name} CASCADE`);
    }

    // Clean shared tables
    console.log('Cleaning shared tables...');
    await client.query(`DELETE FROM "UsageCounter"`);
    await client.query(`DELETE FROM "Subscription"`);
    await client.query(`DELETE FROM "TenantUser"`);
    await client.query(`DELETE FROM "Branch"`);
    await client.query(`DELETE FROM "User"`);
    await client.query(`DELETE FROM "Tenant"`);
    
    console.log('✅ All data cleaned');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
