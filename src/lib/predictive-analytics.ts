/**
 * Predictive AI Analytics for Policy Leakage Detection
 * Uses machine learning patterns to predict which policies are at risk of lapsing
 */

import { db } from '@/lib/db';
import { policies, clients } from '@/db/schema';
import { sql, and, eq, inArray } from 'drizzle-orm';

export interface PolicyRiskScore {
  policyId: string;
  policyNumber: string;
  insuredName: string;
  currentRiskScore: number;
  riskFactors: RiskFactor[];
  predictedLeakageProbability: number;
  recommendedActions: string[];
}

export interface RiskFactor {
  factor: string;
  weight: number;
  value: string | number;
  impact: 'high' | 'medium' | 'low';
}

/**
 * Calculate risk score for a policy based on multiple factors
 */
export function calculatePolicyRiskScore(policy: any, client: any): number {
  let riskScore = 0;
  // const factors: RiskFactor[] = []; // Removed unused variable

  // Factor 1: Days until expiration (higher risk closer to expiration)
  const daysUntilExpiration = Math.floor(
    (new Date(policy.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiration < 30) {
    riskScore += 30;
  } else if (daysUntilExpiration < 60) {
    riskScore += 20;
  }

  // Factor 2: Premium increase rate
  const premium = parseFloat(policy.premium || 0);
  if (premium > 20000) {
    riskScore += 15;
  }

  // Factor 3: Policy type
  const highChurnTypes = ['Commercial Auto', 'General Liability'];
  if (highChurnTypes.includes(policy.policyType)) {
    riskScore += 10;
  }

  // Factor 4: Client engagement
  if (client && !client.portalAccessEnabled) {
    riskScore += 15;
  }

  // Factor 5: Health score
  if (policy.healthScore < 50) {
    riskScore += 20;
  } else if (policy.healthScore < 70) {
    riskScore += 10;
  }

  // Normalize to 0-100
  return Math.min(riskScore, 100);
}

/**
 * Predict which policies are at risk of leakage
 */
export async function predictPolicyLeakage(agencyId: string): Promise<PolicyRiskScore[]> {
  if (!db) return [];

  // Get all active policies using raw SQL for conditions
  const activePolicies = await db
    .select()
    .from(policies)
    .where(and(eq(policies.agencyId, agencyId), eq(policies.status, 'active')));

  const riskScores: PolicyRiskScore[] = [];

  for (const policy of activePolicies) {
    // Get client information
    const client = await db
      .select()
      .from(clients)
      .where(sql`${clients.id} = ${policy.clientId}`)
      .limit(1)
      .then((r: any[]) => r[0]);

    // Calculate risk score
    const riskScore = calculatePolicyRiskScore(policy, client);

    // Get detailed risk factors
    const factors: RiskFactor[] = [];
    const daysUntilExpiration = Math.floor(
      (new Date(policy.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiration < 30) {
      factors.push({ factor: 'Expiring soon', weight: 30, value: daysUntilExpiration, impact: 'high' });
    }
    if (client && !client.portalAccessEnabled) {
      factors.push({ factor: 'No portal access', weight: 15, value: 'No', impact: 'medium' });
    }
    if (policy.healthScore < 50) {
      factors.push({ factor: 'Low health score', weight: 20, value: policy.healthScore, impact: 'high' });
    }
    if (parseFloat(policy.premium || 0) > 20000) {
      factors.push({ factor: 'High premium', weight: 15, value: parseFloat(policy.premium), impact: 'medium' });
    }

    // Generate recommended actions
    const recommendedActions: string[] = [];
    if (daysUntilExpiration < 30) {
      recommendedActions.push('Contact insured immediately to discuss renewal');
    }
    if (client && !client.portalAccessEnabled) {
      recommendedActions.push('Enable portal access to increase engagement');
    }
    if (policy.healthScore < 50) {
      recommendedActions.push('Send AI rate explainer to justify current pricing');
    }
    if (parseFloat(policy.premium || 0) > 20000) {
      recommendedActions.push('Schedule in-person meeting to review coverage');
    }

    riskScores.push({
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      insuredName: client?.name || 'Unknown',
      currentRiskScore: riskScore,
      riskFactors: factors,
      predictedLeakageProbability: riskScore / 100,
      recommendedActions,
    });
  }

  return riskScores.sort((a, b) => b.currentRiskScore - a.currentRiskScore);
}

/**
 * Get leakage prediction summary
 */
export async function getLeakagePredictionSummary(agencyId: string) {
  const riskScores = await predictPolicyLeakage(agencyId);

  const highRisk = riskScores.filter(r => r.currentRiskScore >= 70);
  const mediumRisk = riskScores.filter(r => r.currentRiskScore >= 40 && r.currentRiskScore < 70);
  const lowRisk = riskScores.filter(r => r.currentRiskScore < 40);

  const highRiskVolume = await db
    .select({ total: sql<string>`COALESCE(SUM(CAST(${policies.premium} AS NUMERIC)), 0)` })
    .from(policies)
    .where(
      and(
        eq(policies.agencyId, agencyId),
        highRisk.length > 0 ? inArray(policies.id, highRisk.map(r => r.policyId)) : sql`false`
      )
    )
    .then((r: any[]) => r[0]?.total || '0');

  const projectedLoss = (parseFloat(highRiskVolume) * 0.3).toFixed(2);

  return {
    totalPolicies: riskScores.length,
    highRiskCount: highRisk.length,
    mediumRiskCount: mediumRisk.length,
    lowRiskCount: lowRisk.length,
    highRiskVolume,
    projectedLoss,
    averageRiskScore: riskScores.length > 0 
      ? riskScores.reduce((sum: number, r: any) => sum + r.currentRiskScore, 0) / riskScores.length
      : 0,
    topRiskFactors: getTopRiskFactors(riskScores),
  };
}

/**
 * Get most common risk factors across all policies
 */
function getTopRiskFactors(riskScores: PolicyRiskScore[]): Array<{ factor: string; count: number }> {
  const factorCounts = new Map<string, number>();

  for (const policy of riskScores) {
    for (const factor of policy.riskFactors) {
      factorCounts.set(factor.factor, (factorCounts.get(factor.factor) || 0) + 1);
    }
  }

  return Array.from(factorCounts.entries())
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/**
 * Get AI-powered leakage prevention recommendations
 */
export async function getLeakagePreventionRecommendations(agencyId: string) {
  const summary = await getLeakagePredictionSummary(agencyId);
  const recommendations: string[] = [];

  if (summary.highRiskCount > 10) {
    recommendations.push('Launch automated renewal reminder campaign for high-risk policies');
  }

  if (summary.topRiskFactors.some(f => f.factor === 'No portal access')) {
    recommendations.push('Send portal invitation emails to clients without access');
  }

  if (summary.topRiskFactors.some(f => f.factor === 'Low health score')) {
    recommendations.push('Use AI Rate Explainer to communicate value to at-risk clients');
  }

  if (parseFloat(summary.projectedLoss) > 50000) {
    recommendations.push('Prioritize in-person meetings for policies with projected loss >$50k');
  }

  if (summary.averageRiskScore > 50) {
    recommendations.push('Review overall book of business health and consider portfolio diversification');
  }

  return {
    summary,
    recommendations,
    urgency: summary.averageRiskScore > 60 ? 'critical' : summary.averageRiskScore > 40 ? 'high' : 'moderate',
  };
}
