/**
 * Advanced Analytics for Insurance Agency Owners
 * Focus on Book of Business metrics, renewal pipeline, and policy leakage detection
 */

import { db } from '@/lib/db';
import { policies, clients } from '@/db/schema';
import { eq, and, sql, desc, gte, lte } from 'drizzle-orm';

interface Policy {
  id: string;
  agencyId: string;
  premium: string;
  status: string;
  expirationDate: Date;
  createdAt: Date;
  healthStatus?: string;
  carrier?: string;
  policyType?: string;
}

interface Client {
  id: string;
  agencyId: string;
}

interface CountResult {
  count: number;
}

interface TotalResult {
  total: string;
}

interface CarrierBreakdownRaw {
  carrier: string;
  policyCount: number;
  totalPremium: string;
}

interface PolicyTypeBreakdownRaw {
  policyType: string;
  policyCount: number;
  totalPremium: string;
}

export interface AnalyticsMetrics {
  totalBookOfBusiness: string;
  totalPolicies: number;
  totalInsureds: number;
  averagePremium: string;
  renewalPipeline: RenewalPipelineMetrics;
  policyLeakage: PolicyLeakageMetrics;
  carrierBreakdown: CarrierMetrics[];
  policyTypeBreakdown: PolicyTypeMetrics[];
  monthlyTrends: MonthlyTrend[];
}

export interface RenewalPipelineMetrics {
  renewalsThisMonth: number;
  renewalsNextMonth: number;
  renewalsNextQuarter: number;
  atRiskCount: number;
  atRiskVolume: string;
  healthyCount: number;
  healthyVolume: string;
}

export interface PolicyLeakageMetrics {
  lapsedPolicies: number;
  lapsedVolume: string;
  policiesAtRisk: number;
  atRiskVolume: string;
  leakageRate: number;
  projectedLoss: string;
}

export interface CarrierMetrics {
  carrier: string;
  policyCount: number;
  totalPremium: string;
  averagePremium: string;
  atRiskCount: number;
}

export interface PolicyTypeMetrics {
  policyType: string;
  policyCount: number;
  totalPremium: string;
  averagePremium: string;
  growthRate: number;
}

export interface MonthlyTrend {
  month: string;
  newBusiness: number;
  renewals: number;
  lapses: number;
  premiumVolume: string;
}

/**
 * Get comprehensive analytics for an agency
 */
export async function getAgencyAnalytics(agencyId: string): Promise<AnalyticsMetrics> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfNextQuarter = new Date(now.getFullYear(), now.getMonth() + 3, 1);
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  // Get total book of business
  const totalPremium = await db
    .select({ total: sql<string>`COALESCE(SUM(CAST(${policies.premium} AS NUMERIC)), 0)` })
    .from(policies)
    .where(and(eq(policies.agencyId, agencyId), eq(policies.status, 'active')))
    .then((r: Array<TotalResult>) => r[0]?.total || '0');

  const totalPolicies = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(policies)
    .where(and(eq(policies.agencyId, agencyId), eq(policies.status, 'active')))
    .then((r: Array<CountResult>) => r[0]?.count || 0);

  const totalInsureds = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(clients)
    .where(eq(clients.agencyId, agencyId))
    .then((r: Array<CountResult>) => r[0]?.count || 0);

  const averagePremium = totalPolicies > 0 
    ? (parseFloat(totalPremium) / totalPolicies).toFixed(2)
    : '0';

  // Renewal pipeline metrics
  const renewalsThisMonth = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(policies)
    .where(
      and(
        eq(policies.agencyId, agencyId),
        eq(policies.status, 'active'),
        gte(policies.expirationDate, startOfMonth),
        lte(policies.expirationDate, startOfNextMonth)
      )
    )
    .then((r: Array<CountResult>) => r[0]?.count || 0);

  const renewalsNextMonth = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(policies)
    .where(
      and(
        eq(policies.agencyId, agencyId),
        eq(policies.status, 'active'),
        gte(policies.expirationDate, startOfNextMonth),
        lte(policies.expirationDate, startOfNextQuarter)
      )
    )
    .then((r: Array<CountResult>) => r[0]?.count || 0);

  const renewalsNextQuarter = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(policies)
    .where(
      and(
        eq(policies.agencyId, agencyId),
        eq(policies.status, 'active'),
        gte(policies.expirationDate, startOfNextQuarter)
      )
    )
    .then((r: Array<CountResult>) => r[0]?.count || 0);

  const atRiskPolicies = await db
    .select()
    .from(policies)
    .where(
      and(
        eq(policies.agencyId, agencyId),
        eq(policies.status, 'active'),
        eq(policies.healthStatus, 'at-risk')
      )
    );

  const atRiskVolume = atRiskPolicies.reduce((sum: number, p: Policy) => sum + parseFloat(p.premium || '0'), 0);

  const healthyPolicies = await db
    .select()
    .from(policies)
    .where(
      and(
        eq(policies.agencyId, agencyId),
        eq(policies.status, 'active'),
        eq(policies.healthStatus, 'healthy')
      )
    );

  const healthyVolume = healthyPolicies.reduce((sum: number, p: Policy) => sum + parseFloat(p.premium || '0'), 0);

  // Policy leakage metrics
  const lapsedPolicies = await db
    .select()
    .from(policies)
    .where(
      and(
        eq(policies.agencyId, agencyId),
        eq(policies.status, 'expired')
      )
    );

  const lapsedVolume = lapsedPolicies.reduce((sum: number, p: Policy) => sum + parseFloat(p.premium || '0'), 0);

  const leakageRate = totalPolicies > 0 ? (lapsedPolicies.length / totalPolicies) * 100 : 0;
  const projectedLoss = (atRiskVolume * (leakageRate / 100)).toFixed(2);

  // Carrier breakdown
  const carrierBreakdown = await db
    .select({
      carrier: policies.carrier,
      policyCount: sql<number>`COUNT(*)`,
      totalPremium: sql<string>`COALESCE(SUM(CAST(${policies.premium} AS NUMERIC)), 0)`,
    })
    .from(policies)
    .where(and(eq(policies.agencyId, agencyId), eq(policies.status, 'active')))
    .groupBy(policies.carrier)
    .orderBy(desc(sql`COUNT(*)`))
    .then((r: Array<CarrierBreakdownRaw>) => r.map(c => ({
      carrier: c.carrier,
      policyCount: c.policyCount,
      totalPremium: c.totalPremium,
      averagePremium: c.policyCount > 0 ? (parseFloat(c.totalPremium) / c.policyCount).toFixed(2) : '0',
      atRiskCount: atRiskPolicies.filter((p: Policy) => p.carrier === c.carrier).length,
    })));

  // Policy type breakdown
  const policyTypeBreakdown = await db
    .select({
      policyType: policies.policyType,
      policyCount: sql<number>`COUNT(*)`,
      totalPremium: sql<string>`COALESCE(SUM(CAST(${policies.premium} AS NUMERIC)), 0)`,
    })
    .from(policies)
    .where(and(eq(policies.agencyId, agencyId), eq(policies.status, 'active')))
    .groupBy(policies.policyType)
    .orderBy(desc(sql`COUNT(*)`))
    .then((r: Array<PolicyTypeBreakdownRaw>) => r.map(pt => ({
      policyType: pt.policyType,
      policyCount: pt.policyCount,
      totalPremium: pt.totalPremium,
      averagePremium: pt.policyCount > 0 ? (parseFloat(pt.totalPremium) / pt.policyCount).toFixed(2) : '0',
      growthRate: 0, // Would need historical data for this
    })));

  // Monthly trends (last 6 months)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  
  const rawTrends = await db.execute(sql`
    WITH months AS (
      SELECT generate_series(
        date_trunc('month', ${sixMonthsAgo}::timestamp),
        date_trunc('month', ${now}::timestamp),
        '1 month'::interval
      ) AS month_date
    )
    SELECT
      to_char(m.month_date, 'Mon YY') as month,
      m.month_date as raw_date,
      COUNT(p_new.id)::int as "newBusiness",
      COUNT(p_ren.id)::int as "renewals",
      COUNT(p_lapse.id)::int as "lapses",
      COALESCE(SUM(CAST(p_new.premium AS NUMERIC)), 0)::text as "premiumVolume"
    FROM months m
    LEFT JOIN ${policies} p_new 
      ON p_new."agencyId" = ${agencyId} 
      AND date_trunc('month', p_new."createdAt") = m.month_date
    LEFT JOIN ${policies} p_ren 
      ON p_ren."agencyId" = ${agencyId} 
      AND date_trunc('month', p_ren."expirationDate") = m.month_date
    LEFT JOIN ${policies} p_lapse 
      ON p_lapse."agencyId" = ${agencyId} 
      AND p_lapse.status = 'expired'
      AND date_trunc('month', p_lapse."expirationDate") = m.month_date
    GROUP BY m.month_date
    ORDER BY m.month_date ASC
  `);

  const monthlyTrends: MonthlyTrend[] = rawTrends.rows.map((row: any) => ({
    month: row.month,
    newBusiness: row.newBusiness,
    renewals: row.renewals,
    lapses: row.lapses,
    premiumVolume: row.premiumVolume,
  }));

  return {
    totalBookOfBusiness: totalPremium,
    totalPolicies,
    totalInsureds,
    averagePremium,
    renewalPipeline: {
      renewalsThisMonth,
      renewalsNextMonth,
      renewalsNextQuarter,
      atRiskCount: atRiskPolicies.length,
      atRiskVolume: atRiskVolume.toFixed(2),
      healthyCount: healthyPolicies.length,
      healthyVolume: healthyVolume.toFixed(2),
    },
    policyLeakage: {
      lapsedPolicies: lapsedPolicies.length,
      lapsedVolume: lapsedVolume.toFixed(2),
      policiesAtRisk: atRiskPolicies.length,
      atRiskVolume: atRiskVolume.toFixed(2),
      leakageRate,
      projectedLoss,
    },
    carrierBreakdown,
    policyTypeBreakdown,
    monthlyTrends,
  };
}
