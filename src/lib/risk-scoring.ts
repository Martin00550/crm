import { db } from '@/lib/db';
import { policies, renewals, clients } from '@/db/schema';
import { eq, lt, gt, and, sql, lte, gte, desc } from 'drizzle-orm';

// Risk factor weights (configurable)
const RISK_WEIGHTS = {
  expirationTiming: 0.25,
  premiumVolatility: 0.20,
  clientEngagement: 0.15,
  renewalStatus: 0.20,
  policyValue: 0.10,
  carrierRisk: 0.10,
};

// Policy type risk profiles
const POLICY_TYPE_RISK: Record<string, number> = {
  'commercial liability': 0.8,
  'commercial property': 0.7,
  'auto fleet': 0.6,
  'workers compensation': 0.9,
  'professional liability': 0.7,
  'general liability': 0.5,
  'property': 0.4,
  'auto': 0.3,
  'home': 0.2,
  'life': 0.1,
};

// Carrier risk profiles (simplified)
const CARRIER_RISK: Record<string, number> = {
  'high-risk': 0.8,
  'medium-risk': 0.5,
  'low-risk': 0.2,
};

export interface PolicyRisk {
  policyId: string;
  policyNumber: string;
  clientName: string;
  carrier: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  premiumAmount: number;
  renewalDate: string;
  daysUntilRenewal: number;
  lastContact: string;
  trend: 'improving' | 'stable' | 'declining';
  predictedRenewalProbability: number;
  featureImportance: Record<string, number>;
}

export interface RiskFactor {
  type: string;
  severity: number;
  description: string;
  impact: string;
  weight: number;
}

export interface AgencyRiskSummary {
  totalPolicies: number;
  atRiskPolicies: number;
  totalPremiumAtRisk: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  topRiskFactors: Array<{
    factor: string;
    count: number;
    impact: string;
  }>;
}

export async function calculatePolicyRisk(agencyId: string): Promise<PolicyRisk[]> {
  if (!db) return [];

  const today = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(today.getDate() + 90);

  // Get all policies with renewal info
  const policiesWithRenewals = await db
    .select({
      policyId: policies.id,
      policyNumber: policies.policyNumber,
      carrier: policies.carrier,
      premiumAmount: policies.premium,
      currentTermPremium: policies.currentTermPremium,
      previousTermPremium: policies.previousTermPremium,
      expirationDate: policies.expirationDate,
      clientId: policies.clientId,
      clientName: clients.name,
      clientEmail: clients.email,
      renewalStatus: renewals.status,
      renewalDate: renewals.renewalDate,
      renewalNotes: renewals.notes,
    })
    .from(policies)
    .leftJoin(renewals, eq(policies.id, renewals.policyId))
    .leftJoin(clients, eq(policies.clientId, clients.id))
    .where(and(
      eq(policies.agencyId, agencyId),
      gt(policies.expirationDate, today), // Only active policies
      lt(policies.expirationDate, ninetyDaysFromNow) // Expiring within 90 days
    ));

  const riskScores: PolicyRisk[] = [];

  for (const policy of policiesWithRenewals) {
    const riskFactors: RiskFactor[] = [];
    let totalRiskScore = 0;
    const featureImportance: Record<string, number> = {};

    // Calculate days until renewal
    const expirationDate = new Date(policy.expirationDate);
    const daysUntilRenewal = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    // Risk Factor 1: Expiration Timing (weighted)
    let expirationRisk = 0;
    if (daysUntilRenewal <= 30) {
      const severity = daysUntilRenewal <= 15 ? 40 : 25;
      const weight = RISK_WEIGHTS.expirationTiming;
      const weightedScore = severity * weight;
      riskFactors.push({
        type: 'expiring_soon',
        severity,
        description: `Policy expires in ${daysUntilRenewal} days`,
        impact: 'High risk of non-renewal due to time pressure',
        weight,
      });
      expirationRisk = weightedScore;
      featureImportance.expirationTiming = weightedScore;
    } else if (daysUntilRenewal <= 60) {
      const severity = 15;
      const weight = RISK_WEIGHTS.expirationTiming;
      const weightedScore = severity * weight;
      riskFactors.push({
        type: 'expiring_medium',
        severity,
        description: `Policy expires in ${daysUntilRenewal} days`,
        impact: 'Medium renewal urgency',
        weight,
      });
      expirationRisk = weightedScore;
      featureImportance.expirationTiming = weightedScore;
    }
    totalRiskScore += expirationRisk;

    // Risk Factor 2: Premium Volatility (weighted)
    const premiumIncrease = policy.currentTermPremium && policy.previousTermPremium 
      ? parseFloat(policy.currentTermPremium) - parseFloat(policy.previousTermPremium)
      : 0;
    
    let premiumRisk = 0;
    if (premiumIncrease > 0) {
      const increasePercent = (premiumIncrease / parseFloat(policy.previousTermPremium || '1')) * 100;
      const severity = Math.min(increasePercent * 2, 30);
      const weight = RISK_WEIGHTS.premiumVolatility;
      const weightedScore = severity * weight;
      riskFactors.push({
        type: 'premium_increase',
        severity,
        description: `${increasePercent.toFixed(1)}% premium increase`,
        impact: 'Price sensitivity may cause client to shop',
        weight,
      });
      premiumRisk = weightedScore;
      featureImportance.premiumVolatility = weightedScore;
    }
    totalRiskScore += premiumRisk;

    // Risk Factor 3: Policy Type Risk Profile (new)
    const policyTypeRisk = POLICY_TYPE_RISK[policy.carrier?.toLowerCase() || ''] || 0.5;
    if (policyTypeRisk > 0.5) {
      const severity = policyTypeRisk * 20;
      const weight = 0.1;
      const weightedScore = severity * weight;
      riskFactors.push({
        type: 'policy_type_risk',
        severity,
        description: `${policy.carrier} has higher leakage risk profile`,
        impact: 'Policy type historically shows higher leakage rates',
        weight,
      });
      totalRiskScore += weightedScore;
      featureImportance.policyTypeRisk = weightedScore;
    }

    // Risk Factor 4: Client Engagement (weighted)
    let engagementRisk = 0;
    if (policy.renewalNotes && policy.renewalNotes.includes('concern')) {
      const severity = 20;
      const weight = RISK_WEIGHTS.clientEngagement;
      const weightedScore = severity * weight;
      riskFactors.push({
        type: 'client_concern',
        severity,
        description: 'Client concerns noted in renewal',
        impact: 'Client dissatisfaction increases leakage risk',
        weight,
      });
      engagementRisk = weightedScore;
      featureImportance.clientEngagement = weightedScore;
    }
    totalRiskScore += engagementRisk;

    // Risk Factor 5: Renewal Status (weighted)
    let renewalStatusRisk = 0;
    if (policy.renewalStatus === 'lost') {
      const severity = 50;
      const weight = RISK_WEIGHTS.renewalStatus;
      const weightedScore = severity * weight;
      riskFactors.push({
        type: 'renewal_lost',
        severity,
        description: 'Policy marked as lost',
        impact: 'Critical - immediate attention needed',
        weight,
      });
      renewalStatusRisk = weightedScore;
      featureImportance.renewalStatus = weightedScore;
    } else if (policy.renewalStatus === 'at_risk') {
      const severity = 35;
      const weight = RISK_WEIGHTS.renewalStatus;
      const weightedScore = severity * weight;
      riskFactors.push({
        type: 'renewal_at_risk',
        severity,
        description: 'Policy marked as at-risk',
        impact: 'High probability of non-renewal',
        weight,
      });
      renewalStatusRisk = weightedScore;
      featureImportance.renewalStatus = weightedScore;
    }
    totalRiskScore += renewalStatusRisk;

    // Risk Factor 6: Premium Size (weighted)
    const premiumAmount = parseFloat(policy.premiumAmount || '0');
    let valueRisk = 0;
    if (premiumAmount > 10000) {
      const severity = 10;
      const weight = RISK_WEIGHTS.policyValue;
      const weightedScore = severity * weight;
      riskFactors.push({
        type: 'high_value_policy',
        severity,
        description: 'High-value policy ($10k+ premium)',
        impact: 'Significant revenue impact if lost',
        weight,
      });
      valueRisk = weightedScore;
      featureImportance.policyValue = weightedScore;
    }
    totalRiskScore += valueRisk;

    // Calculate predicted renewal probability (ML-like)
    const predictedRenewalProbability = Math.max(0, Math.min(100, 100 - totalRiskScore));

    // Determine trend (simplified - would need historical data)
    const trend: 'improving' | 'stable' | 'declining' = 
      totalRiskScore < 30 ? 'improving' : totalRiskScore > 60 ? 'declining' : 'stable';

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (totalRiskScore >= 70) {
      riskLevel = 'critical';
    } else if (totalRiskScore >= 50) {
      riskLevel = 'high';
    } else if (totalRiskScore >= 30) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    riskScores.push({
      policyId: policy.policyId,
      policyNumber: policy.policyNumber,
      clientName: policy.clientName || 'Unknown Client',
      carrier: policy.carrier,
      riskScore: Math.round(totalRiskScore),
      riskLevel,
      riskFactors,
      premiumAmount,
      renewalDate: new Date(policy.expirationDate).toISOString(),
      daysUntilRenewal,
      lastContact: 'Not tracked',
      trend,
      predictedRenewalProbability: Math.round(predictedRenewalProbability),
      featureImportance,
    });
  }

  // Sort by risk score (highest first)
  return riskScores.sort((a, b) => b.riskScore - a.riskScore);
}

export async function getAgencyRiskSummary(agencyId: string): Promise<AgencyRiskSummary> {
  const policyRisks = await calculatePolicyRisk(agencyId);
  
  const totalPolicies = policyRisks.length;
  const atRiskPolicies = policyRisks.filter(p => p.riskLevel !== 'low').length;
  const totalPremiumAtRisk = policyRisks
    .filter(p => p.riskLevel !== 'low')
    .reduce((sum, p) => sum + p.premiumAmount, 0);

  // Calculate risk distribution
  const riskDistribution = policyRisks.reduce(
    (acc, policy) => {
      acc[policy.riskLevel]++;
      return acc;
    },
    { low: 0, medium: 0, high: 0, critical: 0 }
  );

  // Analyze top risk factors
  const factorCounts: Record<string, { count: number; impact: string }> = {};
  policyRisks.forEach(policy => {
    policy.riskFactors.forEach(factor => {
      if (!factorCounts[factor.type]) {
        factorCounts[factor.type] = { count: 0, impact: factor.impact };
      }
      factorCounts[factor.type].count++;
    });
  });

  const topRiskFactors = Object.entries(factorCounts)
    .map(([factor, data]) => ({ factor, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalPolicies,
    atRiskPolicies,
    totalPremiumAtRisk,
    riskDistribution,
    topRiskFactors,
  };
}
