/**
 * Advanced Analytics for Insurance Agency Owners
 * Focus on Book of Business metrics, renewal pipeline, and policy leakage detection
 */

import { db } from '@/lib/db';
import { policies, clients } from '@/db/schema';
import { eq, and, sql, desc, gte, lte } from 'drizzle-orm';

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
    .then((r: any[]) => r[0]?.total || '0');

  const totalPolicies = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(policies)
    .where(and(eq(policies.agencyId, agencyId), eq(policies.status, 'active')))
    .then((r: any[]) => r[0]?.count || 0);

  const totalInsureds = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(clients)
    .where(eq(clients.agencyId, agencyId))
    .then((r: any[]) => r[0]?.count || 0);

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
    .then((r: any[]) => r[0]?.count || 0);

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
    .then((r: any[]) => r[0]?.count || 0);

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
    .then((r: any[]) => r[0]?.count || 0);

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

  const atRiskVolume = atRiskPolicies.reduce((sum: number, p: any) => sum + parseFloat(p.premium || 0), 0);

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

  const healthyVolume = healthyPolicies.reduce((sum: number, p: any) => sum + parseFloat(p.premium || 0), 0);

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

  const lapsedVolume = lapsedPolicies.reduce((sum: number, p: any) => sum + parseFloat(p.premium || 0), 0);

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
    .then((r: any[]) => r.map(c => ({
      carrier: c.carrier,
      policyCount: c.policyCount,
      totalPremium: c.totalPremium,
      averagePremium: c.policyCount > 0 ? (parseFloat(c.totalPremium) / c.policyCount).toFixed(2) : '0',
      atRiskCount: atRiskPolicies.filter((p: any) => p.carrier === c.carrier).length,
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
    .then((r: any[]) => r.map(pt => ({
      policyType: pt.policyType,
      policyCount: pt.policyCount,
      totalPremium: pt.totalPremium,
      averagePremium: pt.policyCount > 0 ? (parseFloat(pt.totalPremium) / pt.policyCount).toFixed(2) : '0',
      growthRate: 0, // Would need historical data for this
    })));

  // Monthly trends (last 6 months)
  const monthlyTrends: MonthlyTrend[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    
    const newBusiness = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(policies)
      .where(
        and(
          eq(policies.agencyId, agencyId),
          gte(policies.createdAt, monthDate),
          lte(policies.createdAt, monthEnd)
        )
      )
      .then((r: any[]) => r[0]?.count || 0);

    const renewals = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(policies)
      .where(
        and(
          eq(policies.agencyId, agencyId),
          gte(policies.expirationDate, monthDate),
          lte(policies.expirationDate, monthEnd)
        )
      )
      .then((r: any[]) => r[0]?.count || 0);

    const lapses = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(policies)
      .where(
        and(
          eq(policies.agencyId, agencyId),
          eq(policies.status, 'expired'),
          gte(policies.expirationDate, monthDate),
          lte(policies.expirationDate, monthEnd)
        )
      )
      .then((r: any[]) => r[0]?.count || 0);

    const premiumVolume = await db
      .select({ total: sql<string>`COALESCE(SUM(CAST(${policies.premium} AS NUMERIC)), 0)` })
      .from(policies)
      .where(
        and(
          eq(policies.agencyId, agencyId),
          gte(policies.createdAt, monthDate),
          lte(policies.createdAt, monthEnd)
        )
      )
      .then((r: any[]) => r[0]?.total || '0');

    monthlyTrends.push({
      month: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      newBusiness,
      renewals,
      lapses,
      premiumVolume,
    });
  }

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
