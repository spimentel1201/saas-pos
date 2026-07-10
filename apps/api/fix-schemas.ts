import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:15432/pos_saas?schema=public',
});

async function fixSchemas() {
  // Get all tenant definitions from the shared DB
  const tenants = await pool.query(`
    SELECT id, name, slug, "schemaName"
    FROM "Tenant"
    ORDER BY id;
  `);

  console.log(`Found ${tenants.rows.length} tenants`);

  // Read template
  const fs = await import('node:fs');
  const templatePath = 'C:\\Users\\CIST\\Documents\\Dev\\Open\\apps\\api\\prisma\\tenants\\template.sql';
  const template = fs.readFileSync(templatePath, 'utf8');

  for (const row of tenants.rows) {
    const schema = row.schemaName;
    console.log(`\nProcessing ${schema} (${row.name})...`);

    // Check if schema exists
    const exists = await pool.query(`
      SELECT 1 FROM pg_namespace WHERE nspname = $1
    `, [schema]);

    if (exists.rows.length > 0) {
      // Schema exists, check if taxes table exists
      const hasTaxes = await pool.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = $1 AND table_name = 'taxes'
        )
      `, [schema]);

      if (hasTaxes.rows[0].exists) {
        console.log(`  ✓ ${schema} already has taxes table, skipping`);
        continue;
      }
      console.log(`  Schema exists but taxes missing, recreating...`);
    } else {
      console.log(`  Schema doesn't exist, creating...`);
    }

    // Apply template
    const sql = template.replaceAll(':schema_name', schema);

    try {
      await pool.query(sql);
      console.log(`  ✓ ${schema} created successfully`);
    } catch (err) {
      console.error(`  ✗ ${schema} ERROR:`, err.message);
    }
  }

  console.log('\nDone!');
  await pool.end();
}

fixSchemas();