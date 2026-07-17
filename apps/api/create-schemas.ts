import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:15432/pos_saas?schema=public',
});

async function createTenantSchemas() {
  const templatePath = resolve('prisma/tenants/template.sql');
  const template = readFileSync(templatePath, 'utf8');

  const tenants = await pool.query('SELECT id, "schemaName" FROM "Tenant";');

  for (const tenant of tenants.rows) {
    const schema = tenant.schemaName;
    console.log(`Creating schema ${schema}...`);

    // Check if already exists
    const exists = await pool.query(
      `
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = $1 AND table_name = 'taxes'
      )
    `,
      [schema],
    );

    if (exists.rows[0].exists) {
      console.log(`  ${schema}: already exists, skipping`);
      continue;
    }

    const sql = template.replaceAll(':schema_name', schema);
    try {
      await pool.query(sql);
      console.log(`  ${schema}: created successfully`);
    } catch (err) {
      console.error(`  ${schema}: ERROR -`, err.message);
    }
  }

  console.log('Done!');
  await pool.end();
}

createTenantSchemas();
