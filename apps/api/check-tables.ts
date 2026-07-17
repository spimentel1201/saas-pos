import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:15432/pos_saas?schema=public',
});

async function checkTables() {
  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  console.table(result.rows);
  await pool.end();
}

checkTables();
