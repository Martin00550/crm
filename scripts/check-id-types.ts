/**
 * Check id column types in database
 */

const { neon: neonClient } = require('@neondatabase/serverless');

const dbConnectionString = process.env.DATABASE_URL;

if (!dbConnectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function checkIdTypes() {
  console.log('Checking id column types in database...');

  try {
    const sql = neonClient(dbConnectionString);

    const result = await sql`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE column_name = 'id' AND table_schema = 'public'
      ORDER BY table_name
    `;

    console.log('\nID column types:');
    console.table(result);

    // Check for text-based id columns (should be uuid for most tables)
    const textIdTables = result.filter((row: { table_name: string; column_name: string; data_type: string }) => row.data_type === 'text' || row.data_type === 'character varying');

    if (textIdTables.length > 0) {
      console.log('\nTables with TEXT id columns (may need fixing):');
      console.table(textIdTables);
    }
  } catch (error) {
    console.error('Error checking id types:', error);
    process.exit(1);
  }
}

checkIdTypes();
