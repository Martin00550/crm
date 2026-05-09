import { db } from './db';
import { sql } from 'drizzle-orm';

/**
 * Executes a database operation within an Agency RLS Context.
 * This is critical for institutional-grade data isolation.
 * 
 * @param agencyId The UUID of the agency whose data should be visible
 * @param fn The database operation to execute
 */
export async function withAgencyContext<T>(
  agencyId: string,
  fn: (tx: any) => Promise<T>
): Promise<T> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  // With Neon HTTP, all statements in a transaction are sent in a single request,
  // allowing session variables like 'SET LOCAL' to persist for the duration of the 'tx'.
  return await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.current_agency_id', ${agencyId}, true)`);
    return await fn(tx);
  });
}

/**
 * Portal Bypass Context
 * Used specifically for the public portal where we resolve branding by subdomain.
 * Since RLS is enabled, we need to temporarily set the context to resolve the agency itself.
 */
export async function withPortalContext<T>(
  subdomain: string,
  fn: (tx: any) => Promise<T>
): Promise<T> {
  if (!db) {
    throw new Error('Database not initialized');
  }

  return await db.transaction(async (tx) => {
    // For the initial lookup, we might need a bypass or a specific 'portal' role.
    // Here we set the context to 'null' or a 'guest' if needed, but our policies
    // currently require an exact match.
    
    // We'll use a specific bypass for the initial branding lookup if we can,
    // otherwise we must ensure branding resolution happens before RLS is applied.
    return await fn(tx);
  });
}
