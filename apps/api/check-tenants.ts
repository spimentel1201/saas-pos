import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:15432/pos_saas?schema=public',
});

async function checkTenants() {
  const result = await pool.query('SELECT id, name, slug, "schemaName" FROM "Tenant";');
  console.table(result.rows);
  await pool.end();
}

checkTenants();
