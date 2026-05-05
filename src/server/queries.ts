import { db } from '@/lib/db';
import { clients, policies } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { getOrSetCached, CacheKeys, CacheConfig } from '@/lib/redis';

/**
 * Centered data fetching queries for the Agency Command Center.
 * These are "read-only" functions that handle database interaction,
 * caching, and type-safe data shaping.
 */

export async function getClientsQuery(agencyId: string, options?: { limit?: number; offset?: number }) {
  if (!db) return [];

  const limit = options?.limit || 100;
  const offset = options?.offset || 0;

  const clientList = await db
    .select({
      id: clients.id,
      name: clients.name,
      email: clients.email,
      phone: clients.phone,
      industry: clients.industry,
      address: clients.address,
      subdomain: clients.subdomain,
      createdAt: clients.createdAt,
      updatedAt: clients.updatedAt,
      totalPolicies: sql<number>`count(${policies.id})::int`,
      totalPremium: sql<number>`coalesce(sum(cast(${policies.premium} as numeric)), 0)`,
      avgHealthScore: sql<number>`coalesce(avg(${policies.healthScore}), 0)::int`,
    })
    .from(clients)
    .leftJoin(policies, eq(clients.id, policies.clientId))
    .where(eq(clients.agencyId, agencyId))
    .groupBy(clients.id)
    .orderBy(desc(clients.updatedAt))
    .limit(limit)
    .offset(offset)
    .execute();

  return clientList.map((client) => {
    let healthStatus = 'healthy';
    if (client.avgHealthScore < 40) healthStatus = 'at-risk';
    else if (client.avgHealthScore < 70) healthStatus = 'warning';

    return {
      ...client,
      totalPolicies: client.totalPolicies || 0,
      totalPremium: formatCurrency(client.totalPremium.toString()),
      healthScore: client.avgHealthScore || 0,
      healthStatus,
    };
  });
}

export async function getDashboardStatsQuery(agencyId: string, range?: string) {
  if (!db) throw new Error('Database connection failed');
  
  const cacheKey = `${CacheKeys.dashboardStats(agencyId)}:${range || 'all'}`;
  
  return getOrSetCached(cacheKey, CacheConfig.DASHBOARD_STATS, async () => {
    if (!db) throw new Error('Database connection failed');
    const totalPremium = await db
      .select({ total: sql<string>`COALESCE(SUM(${policies.premium}::numeric), 0)` })
      .from(policies)
      .where(and(eq(policies.agencyId, agencyId), eq(policies.status, 'active')))
      .then((r: any[]) => r[0]?.total || '0');

    const renewalsAtRisk = await db
      .select({
        id: policies.id,
        premium: policies.premium,
      })
      .from(policies)
      .where(
        and(
          eq(policies.agencyId, agencyId),
          eq(policies.status, 'active'),
          sql`${policies.healthStatus} IN ('critical', 'at-risk', 'at risk')`
        )
      )
      .execute();

    const totalPoliciesCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(policies)
      .where(and(eq(policies.agencyId, agencyId), eq(policies.status, 'active')))
      .then((r: any[]) => r[0]?.count || 0);

    const riskCount = renewalsAtRisk.length;
    const riskVolume = renewalsAtRisk.reduce((sum: number, p) => sum + (parseFloat(p.premium || '0') || 0), 0);

    return {
      totalBookOfBusiness: totalPremium,
      renewalsAtRisk: {
        count: riskCount,
        volume: riskVolume.toString(),
      },
      totalPolicies: totalPoliciesCount,
    };
  });
}

export async function getPolicyLedgerQuery(agencyId: string, limit = 50, range?: string) {
  if (!db) return [];

  // Filter by range if provided (e.g., '30days', '90days')
  let whereClause = and(eq(policies.agencyId, agencyId), eq(policies.status, 'active'));
  
  if (range === '30days') {
    whereClause = and(whereClause, sql`${policies.expirationDate} <= CURRENT_DATE + INTERVAL '30 days'`);
  } else if (range === '90days') {
    whereClause = and(whereClause, sql`${policies.expirationDate} <= CURRENT_DATE + INTERVAL '90 days'`);
  }

  const ledger = await db
    .select({
      id: policies.id,
      policyNumber: policies.policyNumber,
      carrier: policies.carrier,
      policyType: policies.policyType,
      premium: policies.premium,
      effectiveDate: policies.effectiveDate,
      expirationDate: policies.expirationDate,
      status: policies.status,
      healthScore: policies.healthScore,
      healthStatus: policies.healthStatus,
      clientId: policies.clientId,
      clientName: clients.name,
      clientIndustry: clients.industry,
    })
    .from(policies)
    .leftJoin(clients, eq(policies.clientId, clients.id))
    .where(whereClause)
    .orderBy(desc(policies.expirationDate))
    .limit(limit)
    .execute();

  return ledger.map(p => ({
    ...p,
    daysUntilRenewal: Math.ceil((new Date(p.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
  }));
}
