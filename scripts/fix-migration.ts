/**
 * Fix migration by dropping old tables with incompatible schemas
 */

const { neon } = require('@neondatabase/serverless');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

async function fixMigration() {
  console.log('Fixing database migration...');

  try {
    const sql = neon(connectionString);

    // Drop old backup tables that may have incompatible id types
    console.log('Dropping users_backup...');
    await sql`DROP TABLE IF EXISTS users_backup CASCADE`;
    
    console.log('Dropping cross_sell_opportunities...');
    await sql`DROP TABLE IF EXISTS cross_sell_opportunities CASCADE`;

    console.log('Migration fix completed successfully');
  } catch (error) {
    console.error('Migration fix failed:', error);
    process.exit(1);
  }
}

fixMigration();
