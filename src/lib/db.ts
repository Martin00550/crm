import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';

const connectionString = process.env.DATABASE_URL || '';

let sql: any;
let db: any;

if (connectionString && connectionString.startsWith('postgresql')) {
  try {
    sql = neon(connectionString);
    db = drizzle(sql, { schema });
  } catch (error) {
    console.log('Database connection failed, running in demo mode:', error);
    sql = null;
    db = null;
  }
} else {
  console.log('Running in demo mode without database');
  sql = null;
  db = null;
}

export { sql, db };
export type Database = typeof db;
