import { db } from '@/lib/db';
import { policies, clients, renewals, commissions, users } from '@/db/schema';
import { eq, and, gte, lte, sql, desc, asc, between, lt } from 'drizzle-orm';

export interface AdvancedAnalytics {
  // Performance Metrics
  carrierPerformance: CarrierPerformance[];
  producerPerformance: ProducerPerformance[];
  policyTypeAnalysis: PolicyTypeAnalysis[];
  
  // Trend Analysis
  premiumTrends: PremiumTrend[];
  renewalTrends: RenewalTrend[];
  growthMetrics: GrowthMetrics;
  
  // Client Analytics
  clientSegments: ClientSegment[];
  clientLifecycleMetrics: ClientLifecycleMetrics;
  
  // Financial Analytics
  revenueBreakdown: RevenueBreakdown;
  commissionAnalysis: CommissionAnalysis;
  profitabilityMetrics: ProfitabilityMetrics;
}

export interface CarrierPerformance {
  carrier: string;
  policyCount: number;
  totalPremium: number;
  averagePremium: number;
  renewalRate: number;
  lostPolicies: number;
  revenueChange: number;
  marketShare: number;
}

export interface ProducerPerformance {
  producerId: string;
  producerName: string;
  policyCount: number;
  totalPremium: number;
  commissionEarned: number;
  renewalRate: number;
  newPolicies: number;
}

export interface PolicyTypeAnalysis {
  policyType: string;
  count: number;
  totalPremium: number;
  averagePremium: number;
  growthRate: number;
  lossRatio?: number;
  marketTrend: 'growing' | 'stable' | 'declining';
}

export interface PremiumTrend {
  period: string;
  totalPremium: number;
  newBusiness: number;
  renewals: number;
  averagePolicySize: number;
  growthRate: number;
}

export interface RenewalTrend {
  period: string;
  totalPolicies: number;
  renewedPolicies: number;
  renewalRate: number;
  lostPolicies: number;
  retentionRate: number;
}

export interface GrowthMetrics {
  newPoliciesThisMonth: number;
  newPoliciesLastMonth: number;
  growthRate: number;
  yearOverYearGrowth: number;
  projectedAnnualGrowth: number;
}

export interface ClientSegment {
  segment: string;
  count: number;
  totalPremium: number;
  averagePremium: number;
  retentionRate: number;
  growthPotential: 'high' | 'medium' | 'low';
}

export interface ClientLifecycleMetrics {
  newClients: number;
  activeClients: number;
  atRiskClients: number;
  leakageRate: number;
  averageClientValue: number;
  clientAcquisitionCost: number;
}

export interface RevenueBreakdown {
  newBusiness: number;
  renewals: number;
  percentageBreakdown: {
    newBusiness: number;
    renewals: number;
  };
}

export interface CommissionAnalysis {
  totalCommission: number;
  averageCommissionRate: number;
  commissionByCarrier: Array<{
    carrier: string;
    commission: number;
    rate: number;
  }>;
  commissionTrend: Array<{
    period: string;
    commission: number;
  }>;
}

export interface ProfitabilityMetrics {
  grossRevenue: number;
  commissionExpense: number;
  operatingExpense: number;
  netProfit: number;
  profitMargin: number;
  returnOnInvestment: number;
}

export async function getAdvancedAnalytics(agencyId: string): Promise<AdvancedAnalytics> {
  if (!db) {
    throw new Error('Database not connected');
  }

  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());

  // Parallel execution of all analytics queries with error handling
  const [
    carrierPerformance,
    producerPerformance,
    policyTypeAnalysis,
    premiumTrends,
    renewalTrends,
    growthMetrics,
    clientSegments,
    clientLifecycleMetrics,
    revenueBreakdown,
    commissionAnalysis,
    profitabilityMetrics,
  ] = await Promise.all([
    getCarrierPerformance(agencyId, today).catch((_e: unknown) => []),
    getProducerPerformance(agencyId, today).catch((_e: unknown) => []),
    getPolicyTypeAnalysis(agencyId, today, lastYear).catch((_e: unknown) => []),
    getPremiumTrends(agencyId, sixMonthsAgo, today).catch((_e: unknown) => []),
    getRenewalTrends(agencyId, sixMonthsAgo, today).catch((_e: unknown) => []),
    getGrowthMetrics(agencyId, today, lastMonth, lastYear).catch((_e: unknown) => ({
      newPoliciesThisMonth: 0,
      newPoliciesLastMonth: 0,
      growthRate: 0,
      yearOverYearGrowth: 0,
      projectedAnnualGrowth: 0,
    })),
    getClientSegments(agencyId, today).catch((_e: unknown) => []),
    getClientLifecycleMetrics(agencyId, today, lastMonth).catch((_e: unknown) => ({
      newClients: 0,
      activeClients: 0,
      atRiskClients: 0,
      leakageRate: 0,
      averageClientValue: 0,
      clientAcquisitionCost: 0,
    })),
    getRevenueBreakdown(agencyId, today, lastMonth).catch((_e: unknown) => ({
      newBusiness: 0,
      renewals: 0,
      percentageBreakdown: { newBusiness: 0, renewals: 0 },
    })),
    getCommissionAnalysis(agencyId, sixMonthsAgo, today).catch((_e: unknown) => ({
      totalCommission: 0,
      averageCommissionRate: 0,
      commissionByCarrier: [],
      commissionTrend: [],
    })),
    getProfitabilityMetrics(agencyId, today).catch((_e: unknown) => ({
      grossRevenue: 0,
      commissionExpense: 0,
      operatingExpense: 0,
      netProfit: 0,
      profitMargin: 0,
      returnOnInvestment: 0,
    })),
  ]);

  return {
    carrierPerformance,
    producerPerformance,
    policyTypeAnalysis,
    premiumTrends,
    renewalTrends,
    growthMetrics,
    clientSegments,
    clientLifecycleMetrics,
    revenueBreakdown,
    commissionAnalysis,
    profitabilityMetrics,
  };
}

async function getCarrierPerformance(agencyId: string, today: Date): Promise<CarrierPerformance[]> {
  const carrierData = await db
    .select({
      carrier: policies.carrier,
      policyCount: sql<number>`COUNT(*)`.mapWith(Number),
      totalPremium: sql<number>`SUM(CAST(${policies.premium} AS NUMERIC))`.mapWith(Number),
      renewedPolicies: sql<number>`SUM(CASE WHEN ${renewals.status} = 'renewed' THEN 1 ELSE 0 END)`.mapWith(Number),
      lostPolicies: sql<number>`SUM(CASE WHEN ${renewals.status} = 'lost' THEN 1 ELSE 0 END)`.mapWith(Number),
    })
    .from(policies)
    .leftJoin(renewals, eq(policies.id, renewals.policyId))
    .where(and(
      eq(policies.agencyId, agencyId),
      eq(policies.status, 'active')
    ))
    .groupBy(policies.carrier)
    .orderBy(desc(sql`SUM(CAST(${policies.premium} AS NUMERIC))`));

  const totalAgencyPremium = carrierData.reduce((sum: number, carrier: any) => sum + carrier.totalPremium, 0);

  return carrierData.map((carrier: any) => ({
    carrier: carrier.carrier,
    policyCount: carrier.policyCount,
    totalPremium: carrier.totalPremium,
    averagePremium: carrier.policyCount > 0 ? carrier.totalPremium / carrier.policyCount : 0,
    renewalRate: carrier.policyCount > 0 ? (carrier.renewedPolicies / carrier.policyCount) * 100 : 0,
    lostPolicies: carrier.lostPolicies,
    revenueChange: 0, // Would need historical data for this
    marketShare: totalAgencyPremium > 0 ? (carrier.totalPremium / totalAgencyPremium) * 100 : 0,
  }));
}

async function getProducerPerformance(agencyId: string, today: Date): Promise<ProducerPerformance[]> {
  const producerData = await db
    .select({
      producerId: users.id,
      producerName: sql<string>`COALESCE(${users.name}, 'Unknown')`,
      policyCount: sql<number>`COUNT(*)`.mapWith(Number),
      totalPremium: sql<number>`SUM(CAST(${policies.premium} AS NUMERIC))`.mapWith(Number),
      commissionEarned: sql<number>`SUM(CAST(${commissions.commissionAmount} AS NUMERIC))`.mapWith(Number),
      renewedPolicies: sql<number>`SUM(CASE WHEN ${renewals.status} = 'renewed' THEN 1 ELSE 0 END)`.mapWith(Number),
      newPolicies: sql<number>`SUM(CASE WHEN ${policies.createdAt} >= ${sql`date_trunc('month', ${today})`} THEN 1 ELSE 0 END)`.mapWith(Number),
    })
    .from(users)
    .leftJoin(policies, eq(users.id, policies.agencyId)) // This needs adjustment based on actual schema
    .leftJoin(renewals, eq(policies.id, renewals.policyId))
    .leftJoin(commissions, eq(policies.id, commissions.policyId))
    .where(and(
      eq(users.agencyId, agencyId),
      eq(users.role, 'producer')
    ))
    .groupBy(users.id, users.name)
    .orderBy(desc(sql`SUM(CAST(${policies.premium} AS NUMERIC))`));

  return producerData.map((producer: any) => ({
    producerId: producer.producerId,
    producerName: producer.producerName.trim() || 'Unknown Producer',
    policyCount: producer.policyCount,
    totalPremium: producer.totalPremium,
    commissionEarned: producer.commissionEarned,
    renewalRate: producer.policyCount > 0 ? (producer.renewedPolicies / producer.policyCount) * 100 : 0,
    newPolicies: producer.newPolicies,
  }));
}

async function getPolicyTypeAnalysis(agencyId: string, today: Date, lastYear: Date): Promise<PolicyTypeAnalysis[]> {
  const typeData = await db
    .select({
      policyType: policies.policyType,
      currentCount: sql<number>`COUNT(*)`.mapWith(Number),
      currentPremium: sql<number>`SUM(CAST(${policies.premium} AS NUMERIC))`.mapWith(Number),
    })
    .from(policies)
    .where(and(
      eq(policies.agencyId, agencyId),
      eq(policies.status, 'active')
    ))
    .groupBy(policies.policyType);

  // Get historical data for growth rate calculation
  const historicalData = await db
    .select({
      policyType: policies.policyType,
      historicalCount: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(policies)
    .where(and(
      eq(policies.agencyId, agencyId),
      eq(policies.status, 'active'),
      lte(policies.createdAt, lastYear)
    ))
    .groupBy(policies.policyType);

  const historicalMap = new Map<string, number>(historicalData.map((h: any) => [h.policyType, h.historicalCount]));

  return typeData.map((type: any) => {
    const historicalCount = historicalMap.get(type.policyType) || 0;
    const growthRate = historicalCount > 0 
      ? ((type.currentCount - historicalCount) / historicalCount) * 100 
      : 0;

    let marketTrend: 'growing' | 'stable' | 'declining' = 'stable';
    if (growthRate > 5) marketTrend = 'growing';
    else if (growthRate < -5) marketTrend = 'declining';

    return {
      policyType: type.policyType,
      count: type.currentCount,
      totalPremium: type.currentPremium,
      averagePremium: type.currentCount > 0 ? type.currentPremium / type.currentCount : 0,
      growthRate,
      marketTrend,
    };
  });
}

async function getPremiumTrends(agencyId: string, startDate: Date, endDate: Date): Promise<PremiumTrend[]> {
  const monthlyData = await db
    .select({
      period: sql<string>`date_trunc('month', ${policies.createdAt})`,
      totalPremium: sql<number>`SUM(CAST(${policies.premium} AS NUMERIC))`.mapWith(Number),
      policyCount: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(policies)
    .where(and(
      eq(policies.agencyId, agencyId),
      between(policies.createdAt, startDate, endDate)
    ))
    .groupBy(sql`date_trunc('month', ${policies.createdAt})`)
    .orderBy(sql`date_trunc('month', ${policies.createdAt})`);

  let previousPremium = 0;
  return monthlyData.map((month: any, index: number) => {
    const growthRate = index > 0 ? ((month.totalPremium - previousPremium) / previousPremium) * 100 : 0;
    previousPremium = month.totalPremium;

    return {
      period: month.period,
      totalPremium: month.totalPremium,
      newBusiness: month.totalPremium, // Simplified - would need renewal tracking
      renewals: 0,
      averagePolicySize: month.policyCount > 0 ? month.totalPremium / month.policyCount : 0,
      growthRate,
    };
  });
}

async function getRenewalTrends(agencyId: string, startDate: Date, endDate: Date): Promise<RenewalTrend[]> {
  const monthlyRenewals = await db
    .select({
      period: sql<string>`date_trunc('month', ${renewals.renewalDate})`,
      totalPolicies: sql<number>`COUNT(*)`.mapWith(Number),
      renewedPolicies: sql<number>`SUM(CASE WHEN ${renewals.status} = 'renewed' THEN 1 ELSE 0 END)`.mapWith(Number),
      lostPolicies: sql<number>`SUM(CASE WHEN ${renewals.status} = 'lost' THEN 1 ELSE 0 END)`.mapWith(Number),
    })
    .from(renewals)
    .leftJoin(policies, eq(renewals.policyId, policies.id))
    .where(and(
      eq(policies.agencyId, agencyId),
      between(renewals.renewalDate, startDate, endDate)
    ))
    .groupBy(sql`date_trunc('month', ${renewals.renewalDate})`)
    .orderBy(sql`date_trunc('month', ${renewals.renewalDate})`);

  return monthlyRenewals.map((month: any) => ({
    period: month.period,
    totalPolicies: month.totalPolicies,
    renewedPolicies: month.renewedPolicies,
    renewalRate: month.totalPolicies > 0 ? (month.renewedPolicies / month.totalPolicies) * 100 : 0,
    lostPolicies: month.lostPolicies,
    retentionRate: month.totalPolicies > 0 ? ((month.totalPolicies - month.lostPolicies) / month.totalPolicies) * 100 : 0,
  }));
}

async function getGrowthMetrics(agencyId: string, today: Date, lastMonth: Date, lastYear: Date): Promise<GrowthMetrics> {
  const [currentMonth, lastMonthData, lastYearData] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(policies)
      .where(and(
        eq(policies.agencyId, agencyId),
        gte(policies.createdAt, new Date(today.getFullYear(), today.getMonth(), 1))
      )),
    db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(policies)
      .where(and(
        eq(policies.agencyId, agencyId),
        gte(policies.createdAt, new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)),
        lt(policies.createdAt, new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 1))
      )),
    db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(policies)
      .where(and(
        eq(policies.agencyId, agencyId),
        gte(policies.createdAt, new Date(lastYear.getFullYear(), lastYear.getMonth(), 1)),
        lt(policies.createdAt, new Date(lastYear.getFullYear(), lastYear.getMonth() + 1, 1))
      )),
  ]);

  const newPoliciesThisMonth = currentMonth[0]?.count || 0;
  const newPoliciesLastMonth = lastMonthData[0]?.count || 0;
  const newPoliciesLastYear = lastYearData[0]?.count || 0;

  const monthOverMonthGrowth = newPoliciesLastMonth > 0 
    ? ((newPoliciesThisMonth - newPoliciesLastMonth) / newPoliciesLastMonth) * 100 
    : 0;

  const yearOverYearGrowth = newPoliciesLastYear > 0 
    ? ((newPoliciesThisMonth - newPoliciesLastYear) / newPoliciesLastYear) * 100 
    : 0;

  const projectedAnnualGrowth = monthOverMonthGrowth * 12;

  return {
    newPoliciesThisMonth,
    newPoliciesLastMonth,
    growthRate: monthOverMonthGrowth,
    yearOverYearGrowth,
    projectedAnnualGrowth,
  };
}

async function getClientSegments(agencyId: string, today: Date): Promise<ClientSegment[]> {
  // Simplified client segmentation based on premium size
  const segments = await db
    .select({
      clientId: clients.id,
      totalPremium: sql<number>`SUM(CAST(${policies.premium} AS NUMERIC))`.mapWith(Number),
      policyCount: sql<number>`COUNT(*)`.mapWith(Number),
    })
    .from(clients)
    .leftJoin(policies, eq(clients.id, policies.clientId))
    .where(and(
      eq(clients.agencyId, agencyId),
      eq(policies.status, 'active')
    ))
    .groupBy(clients.id)
    .having(sql`SUM(CAST(${policies.premium} AS NUMERIC)) > 0`);

  const segmentData = segments.reduce((acc: Record<string, { count: number; totalPremium: number; policies: number }>, client: any) => {
    let segment: string;
    if (client.totalPremium >= 10000) segment = 'enterprise';
    else if (client.totalPremium >= 5000) segment = 'commercial';
    else if (client.totalPremium >= 1000) segment = 'small-business';
    else segment = 'personal';

    if (!acc[segment]) {
      acc[segment] = { count: 0, totalPremium: 0, policies: 0 };
    }
    acc[segment].count++;
    acc[segment].totalPremium += client.totalPremium;
    acc[segment].policies += client.policyCount;
    return acc;
  }, {} as Record<string, { count: number; totalPremium: number; policies: number }>);

  return (Object.entries(segmentData) as [string, { count: number; totalPremium: number; policies: number }][]).map(([segment, data]) => ({
    segment,
    count: data.count,
    totalPremium: data.totalPremium,
    averagePremium: data.count > 0 ? data.totalPremium / data.count : 0,
    retentionRate: 85, // Simplified - would need actual renewal data
    growthPotential: segment === 'small-business' ? 'high' : segment === 'personal' ? 'medium' : 'low',
  }));
}

async function getClientLifecycleMetrics(agencyId: string, today: Date, lastMonth: Date): Promise<ClientLifecycleMetrics> {
  const [newClients, activeClients, atRiskClients] = await Promise.all([
    db.select({ count: sql<number>`COUNT(*)`.mapWith(Number) })
      .from(clients)
      .where(and(
        eq(clients.agencyId, agencyId),
        gte(clients.createdAt, lastMonth)
      )),
    db.select({ count: sql<number>`COUNT(DISTINCT ${clients.id})`.mapWith(Number) })
      .from(clients)
      .leftJoin(policies, eq(clients.id, policies.clientId))
      .where(and(
        eq(clients.agencyId, agencyId),
        eq(policies.status, 'active')
      )),
    db.select({ count: sql<number>`COUNT(DISTINCT ${clients.id})`.mapWith(Number) })
      .from(clients)
      .leftJoin(policies, eq(clients.id, policies.clientId))
      .leftJoin(renewals, eq(policies.id, renewals.policyId))
      .where(and(
        eq(clients.agencyId, agencyId),
        eq(renewals.status, 'at_risk')
      )),
  ]);

  return {
    newClients: newClients[0]?.count || 0,
    activeClients: activeClients[0]?.count || 0,
    atRiskClients: atRiskClients[0]?.count || 0,
    leakageRate: 5, // Simplified
    averageClientValue: 2500, // Simplified
    clientAcquisitionCost: 500, // Simplified
  };
}

async function getRevenueBreakdown(agencyId: string, today: Date, lastMonth: Date): Promise<RevenueBreakdown> {
  const [newBizResult, renewalResult] = await Promise.all([
    db.select({ premium: sql<number>`SUM(CAST(${policies.premium} AS NUMERIC))`.mapWith(Number) })
      .from(policies)
      .where(and(
        eq(policies.agencyId, agencyId),
        gte(policies.createdAt, lastMonth)
      )),
    db.select({ premium: sql<number>`SUM(CAST(${policies.premium} AS NUMERIC))`.mapWith(Number) })
      .from(policies)
      .leftJoin(renewals, eq(policies.id, renewals.policyId))
      .where(and(
        eq(policies.agencyId, agencyId),
        eq(renewals.status, 'renewed'),
        gte(renewals.renewalDate, lastMonth)
      )),
  ]);

  const newBusinessRevenue = newBizResult[0]?.premium || 0;
  const renewalRevenue = renewalResult[0]?.premium || 0;
  const totalRevenue = newBusinessRevenue + renewalRevenue;

  return {
    newBusiness: newBusinessRevenue,
    renewals: renewalRevenue,
    percentageBreakdown: {
      newBusiness: totalRevenue > 0 ? (newBusinessRevenue / totalRevenue) * 100 : 0,
      renewals: totalRevenue > 0 ? (renewalRevenue / totalRevenue) * 100 : 0,
    },
  };
}

async function getCommissionAnalysis(agencyId: string, startDate: Date, endDate: Date): Promise<CommissionAnalysis> {
  const [totalCommission, commissionByCarrier, commissionTrend] = await Promise.all([
    db.select({ total: sql<number>`SUM(CAST(${commissions.commissionAmount} AS NUMERIC))`.mapWith(Number) })
      .from(commissions)
      .leftJoin(policies, eq(commissions.policyId, policies.id))
      .where(and(
        eq(policies.agencyId, agencyId),
        between(commissions.createdAt, startDate, endDate)
      )),
    db.select({
      carrier: policies.carrier,
      commission: sql<number>`SUM(CAST(${commissions.commissionAmount} AS NUMERIC))`.mapWith(Number),
      premium: sql<number>`SUM(CAST(${commissions.totalPremium} AS NUMERIC))`.mapWith(Number),
    })
      .from(commissions)
      .leftJoin(policies, eq(commissions.policyId, policies.id))
      .where(and(
        eq(policies.agencyId, agencyId),
        between(commissions.createdAt, startDate, endDate)
      ))
      .groupBy(policies.carrier),
    db.select({
      period: sql<string>`date_trunc('month', ${commissions.createdAt})`,
      commission: sql<number>`SUM(CAST(${commissions.commissionAmount} AS NUMERIC))`.mapWith(Number),
    })
      .from(commissions)
      .leftJoin(policies, eq(commissions.policyId, policies.id))
      .where(and(
        eq(policies.agencyId, agencyId),
        between(commissions.createdAt, startDate, endDate)
      ))
      .groupBy(sql`date_trunc('month', ${commissions.createdAt})`)
      .orderBy(sql`date_trunc('month', ${commissions.createdAt})`),
  ]);

  const totalCommissionAmount = totalCommission[0]?.total || 0;
  const totalPremium = commissionByCarrier.reduce((sum: number, carrier: any) => sum + carrier.premium, 0);
  const averageRate = totalPremium > 0 ? (totalCommissionAmount / totalPremium) * 100 : 0;

  return {
    totalCommission: totalCommissionAmount,
    averageCommissionRate: averageRate,
    commissionByCarrier: commissionByCarrier.map((carrier: any) => ({
      carrier: carrier.carrier,
      commission: carrier.commission,
      rate: carrier.premium > 0 ? (carrier.commission / carrier.premium) * 100 : 0,
    })),
    commissionTrend: commissionTrend.map((trend: any) => ({
      period: trend.period,
      commission: trend.commission,
    })),
  };
}

async function getProfitabilityMetrics(agencyId: string, today: Date): Promise<ProfitabilityMetrics> {
  // Simplified profitability metrics
  const totalRevenue = await db
    .select({ premium: sql<number>`SUM(CAST(${policies.premium} AS NUMERIC))`.mapWith(Number) })
    .from(policies)
    .where(and(
      eq(policies.agencyId, agencyId),
      eq(policies.status, 'active')
    ));

  const totalCommission = await db
    .select({ commission: sql<number>`SUM(CAST(${commissions.commissionAmount} AS NUMERIC))`.mapWith(Number) })
    .from(commissions)
    .leftJoin(policies, eq(commissions.policyId, policies.id))
    .where(and(
      eq(policies.agencyId, agencyId),
      eq(policies.status, 'active')
    ));

  const grossRevenue = totalRevenue[0]?.premium || 0;
  const commissionExpense = totalCommission[0]?.commission || 0;
  const operatingExpense = grossRevenue * 0.15; // Assumed 15% operating expenses
  const netProfit = grossRevenue - commissionExpense - operatingExpense;
  const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
  const returnOnInvestment = commissionExpense > 0 ? (netProfit / commissionExpense) * 100 : 0;

  return {
    grossRevenue,
    commissionExpense,
    operatingExpense,
    netProfit,
    profitMargin,
    returnOnInvestment,
  };
}
