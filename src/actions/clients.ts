'use server';

import { db } from '@/lib/db';
import { clients, policies } from '@/db/schema';
import { eq, desc, sql, InferSelectModel } from 'drizzle-orm';
import { requireAgencyAuth } from '@/lib/auth-wrapper';
import { Errors } from '@/lib/error-handler';
import { formatCurrency } from '@/lib/utils';

import { getClientsQuery } from '@/server/queries';

export async function getClients(agencyId: string, options?: { limit?: number; offset?: number }) {
  const authResult = await requireAgencyAuth();
  if (authResult.agencyId !== agencyId) {
    throw Errors.authorization('Forbidden: You do not have access to this agency');
  }

  return getClientsQuery(agencyId, options);
}

export async function checkMockDataStatus(agencyId: string) {
  const authResult = await requireAgencyAuth();
  if (authResult.agencyId !== agencyId) {
    throw Errors.authorization('Forbidden: You do not have access to this agency');
  }

  if (!db) {
    return { hasData: false };
  }

  const clientCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(clients)
    .where(eq(clients.agencyId, agencyId))
    .then(r => r[0]?.count || 0);

  return { hasData: clientCount > 0 };
}
