'use server';

import { db } from '@/lib/db';
import { policies, clients } from '@/db/schema';
import { eq, and, desc, sql, InferSelectModel } from 'drizzle-orm';
import { requireAgencyAuth } from '@/lib/auth-wrapper';
import { Errors } from '@/lib/error-handler';
import { formatCurrency, formatDate, calculateDaysUntil } from '@/lib/utils';
import { revalidatePath } from 'next/cache';

import { getPolicyLedgerQuery } from '@/server/queries';

export async function getPolicyLedger(agencyId: string, limit = 50, range?: string) {
  const authResult = await requireAgencyAuth();
  if (authResult.agencyId !== agencyId) {
    throw Errors.authorization('Forbidden: You do not have access to this agency');
  }
  
  return getPolicyLedgerQuery(agencyId, limit, range);
}

import { withAgencyContext } from '@/lib/db-rls';

export async function getPolicyDetails(policyId: string) {
  const authResult = await requireAgencyAuth();
  
  return withAgencyContext(authResult.agencyId, async (tx) => {
    const [policy] = await tx
      .select()
      .from(policies)
      .where(eq(policies.id, policyId))
      .limit(1);

    if (!policy) return null;

    const [client] = await tx
      .select()
      .from(clients)
      .where(eq(clients.id, policy.clientId))
      .limit(1);

    const prevPremium = parseFloat(policy.previousTermPremium || '0');
    const currPremium = parseFloat(policy.currentTermPremium || '0');
    const premiumChange = prevPremium > 0 && currPremium > 0
      ? (((currPremium - prevPremium) / prevPremium) * 100).toFixed(1)
      : '0';

    return {
      policy,
      client,
      premiumChange: parseFloat(premiumChange),
    };
  });
}

export async function updatePolicy(
  policyId: string,
  data: {
    premium?: string;
    currentTermPremium?: string;
    expirationDate?: Date;
    status?: string;
    notes?: string;
  }
) {
  const authResult = await requireAgencyAuth();
  
  if (!db) {
    throw Errors.server('Database connection failed');
  }
  
  const [policy] = await db
    .select({ agencyId: policies.agencyId })
    .from(policies)
    .where(eq(policies.id, policyId))
    .limit(1);
  
  if (!policy) {
    throw Errors.notFound('Policy');
  }
  
  if (policy.agencyId !== authResult.agencyId) {
    throw Errors.authorization('Forbidden: You do not have access to this policy');
  }

  await db
    .update(policies)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(policies.id, policyId));

  revalidatePath('/');
  return { success: true };
}

export async function getPolicyLeakageRisk(agencyId: string) {
  const authResult = await requireAgencyAuth();
  if (authResult.agencyId !== agencyId) {
    throw Errors.authorization('Forbidden: You do not have access to this agency');
  }
  
  if (!db) {
    throw Errors.server('Database connection failed');
  }

  const allPolicies = await withAgencyContext(agencyId, async (tx) => {
    return await tx
      .select({
        id: policies.id,
        policyNumber: policies.policyNumber,
        carrier: policies.carrier,
        policyType: policies.policyType,
        premium: policies.premium,
        currentTermPremium: policies.currentTermPremium,
        previousTermPremium: policies.previousTermPremium,
        expirationDate: policies.expirationDate,
        healthScore: policies.healthScore,
        healthStatus: policies.healthStatus,
        notes: policies.notes,
        clientName: clients.name,
        clientEmail: clients.email,
        clientIndustry: clients.industry,
        clientId: policies.clientId,
      })
      .from(policies)
      .innerJoin(clients, eq(policies.clientId, clients.id))
      .where(and(eq(policies.agencyId, agencyId), eq(policies.status, 'active')))
      .execute();
  });

  const riskData = allPolicies.map((p: any) => {
    const daysUntilRenewal = calculateDaysUntil(p.expirationDate);
    const premium = parseFloat(p.premium || '0');
    const currentPremium = parseFloat(p.currentTermPremium || p.premium || '0');
    const previousPremium = parseFloat(p.previousTermPremium || '0');
    
    const premiumChange = previousPremium > 0 
      ? ((currentPremium - previousPremium) / previousPremium) * 100 
      : 0;
    
    let riskScore = 0;
    const riskFactors: string[] = [];
    
    if (daysUntilRenewal <= 30) {
      riskScore += 40;
      riskFactors.push('Renewal within 30 days');
    } else if (daysUntilRenewal <= 60) {
      riskScore += 25;
      riskFactors.push('Renewal within 60 days');
    } else if (daysUntilRenewal <= 90) {
      riskScore += 15;
      riskFactors.push('Renewal within 90 days');
    }
    
    if (premiumChange >= 30) {
      riskScore += 30;
      riskFactors.push(`Premium increased ${premiumChange.toFixed(1)}%`);
    } else if (premiumChange >= 15) {
      riskScore += 20;
      riskFactors.push(`Premium increased ${premiumChange.toFixed(1)}%`);
    }
    
    if (p.healthScore && p.healthScore < 40) {
      riskScore += 20;
      riskFactors.push(`Low health score: ${p.healthScore}`);
    }
    
    if (premium > 20000) {
      riskScore += 10;
      riskFactors.push(`High-value policy: $${premium.toLocaleString()}`);
    }
    
    riskScore = Math.min(riskScore, 100);
    
    let riskLevel = 'low';
    if (riskScore >= 70) riskLevel = 'critical';
    else if (riskScore >= 50) riskLevel = 'high';
    else if (riskScore >= 30) riskLevel = 'medium';
    
    return {
      ...p,
      premium: formatCurrency(p.premium),
      daysUntilRenewal,
      premiumChange: premiumChange.toFixed(1),
      riskScore,
      riskLevel: riskLevel as 'low' | 'medium' | 'high' | 'critical',
      riskFactors,
      potentialLoss: premium,
    };
  });
  
  riskData.sort((a: any, b: any) => b.riskScore - a.riskScore);
  
  const summary = {
    totalPolicies: riskData.length,
    criticalRisk: riskData.filter((p: any) => p.riskLevel === 'critical').length,
    highRisk: riskData.filter((p: any) => p.riskLevel === 'high').length,
    mediumRisk: riskData.filter((p: any) => p.riskLevel === 'medium').length,
    lowRisk: riskData.filter((p: any) => p.riskLevel === 'low').length,
    totalPotentialLoss: riskData
      .filter((p: any) => p.riskLevel === 'critical' || p.riskLevel === 'high')
      .reduce((sum: number, p: any) => sum + p.potentialLoss, 0),
    avgRiskScore: riskData.length > 0 
      ? Math.round(riskData.reduce((sum: number, p: any) => sum + p.riskScore, 0) / riskData.length)
      : 0,
  };
  
  return {
    policies: riskData.slice(0, 50),
    summary,
  };
}

export async function getRetentionStrategy(policyId: string) {
  const details = await getPolicyDetails(policyId);
  if (!details || !details.policy || !details.client) return null;
  const { policy, client, premiumChange } = details;

  // Simple rule-based "AI" strategy for now
  // In production, this would call OpenAI/Gemini
  const strategies = [];
  
  if (premiumChange > 15) {
    strategies.push({
      priority: 'high',
      action: 'Remarket Coverage',
      description: `Premium increased by ${premiumChange}%. Shop this policy across 3 other carriers to find a more competitive rate.`,
    });
  }

  if (policy.healthScore !== null && policy.healthScore < 50) {
    strategies.push({
      priority: 'medium',
      action: 'Client Consultation',
      description: 'Low health score detected. Schedule a 15-minute review call to discuss coverage gaps and build relationship.',
    });
  }

  if (calculateDaysUntil(policy.expirationDate) < 30) {
    strategies.push({
      priority: 'critical',
      action: 'Urgent Renewal Outreach',
      description: 'Policy expires in less than 30 days. Send automated renewal proposal immediately.',
    });
  }

  return {
    policyId,
    clientName: client.name,
    strategies,
  };
}
