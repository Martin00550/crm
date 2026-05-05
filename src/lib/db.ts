import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';
import { logger } from '@/lib/logger';

const connectionString = process.env.DATABASE_URL || '';

let sql: NeonQueryFunction<boolean, boolean> | null = null;
let db: NeonHttpDatabase<typeof schema> | null = null;

if (connectionString && connectionString.startsWith('postgresql')) {
  try {
    sql = neon(connectionString);
    db = drizzle(sql, { schema });
  } catch (error) {
    logger.warn('Database connection failed, running in demo mode', { error: error instanceof Error ? error.message : String(error) });
  }
} else {
  logger.info('Running in demo mode without database');
}

export { sql, db };
export type Database = typeof db;
