'use server';

import { db } from '@/lib/db';
import { policies, clients, renewals, commissions, users, agencies } from '@/db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { requireAuth, requireAgencyAuth, requireOwnership } from '@/lib/auth-wrapper';
import { formatCurrency, formatDate, calculateDaysUntil } from '@/lib/utils';
import { getOrSetCached, CacheKeys, CacheConfig, invalidateResourceCache } from '@/lib/redis';
import { revalidatePath } from 'next/cache';

export async function getUserAgencyId(userId: string): Promise<string | null> {
  if (!db) return null;

  const user = await db
    .select({ agencyId: users.agencyId })
    .from(users)
    .where(eq(users.betterAuthUserId, userId))
    .limit(1)
    .then((r: typeof users.$inferSelect[]) => r[0]);

  return user?.agencyId || null;
}

export async function getDashboardStats(agencyId: string) {
  // Verify user has access to this agency
  const authResult = await requireAgencyAuth();
  if (authResult.agencyId !== agencyId) {
    throw new Error('Forbidden: You do not have access to this agency');
  }
  
  if (!db) {
    throw new Error('Database not connected');
  }

  // Use Redis caching
  const cacheKey = CacheKeys.dashboardStats(agencyId);
  return getOrSetCached(cacheKey, CacheConfig.DASHBOARD_STATS, async () => {
    const totalPremium = await db
      .select({ total: sql<string>`COALESCE(SUM(${policies.premium}::numeric), 0)` })
      .from(policies)
      .where(and(eq(policies.agencyId, agencyId), eq(policies.status, 'active')))
      .then((r: any[]) => r[0]?.total || '0');

    const renewalsAtRisk = await db
      .select()
      .from(policies)
      .where(
        and(
          eq(policies.agencyId, agencyId),
          eq(policies.status, 'active'),
          eq(policies.healthStatus, 'at-risk')
        )
      )
      .execute();

    const totalPolicies = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(policies)
      .where(and(eq(policies.agencyId, agencyId), eq(policies.status, 'active')))
      .then((r: any[]) => r[0]?.count || 0);

    const policyCount = renewalsAtRisk.length;
    const policyVolume = renewalsAtRisk.reduce((sum: number, p: any) => sum + parseFloat(p.premium), 0);

    return {
      totalBookOfBusiness: totalPremium,
      renewalsAtRisk: {
        count: policyCount,
        volume: policyVolume.toString(),
      },
      totalPolicies,
    };
  });
}

export async function getPolicyLedger(agencyId: string, limit = 50) {
  // Verify user has access to this agency
  const authResult = await requireAgencyAuth();
  if (authResult.agencyId !== agencyId) {
    throw new Error('Forbidden: You do not have access to this agency');
  }
  
  if (!db) {
    throw new Error('Database not connected');
  }

  const policyList = await db
    .select({
      id: policies.id,
      policyNumber: policies.policyNumber,
      carrier: policies.carrier,
      policyType: policies.policyType,
      premium: policies.premium,
      expirationDate: policies.expirationDate,
      healthStatus: policies.healthStatus,
      healthScore: policies.healthScore,
      clientName: clients.name,
      clientIndustry: clients.industry,
    })
    .from(policies)
    .innerJoin(clients, eq(policies.clientId, clients.id))
    .where(and(eq(policies.agencyId, agencyId), eq(policies.status, 'active')))
    .orderBy(desc(policies.expirationDate))
    .limit(limit)
    .execute();

  return policyList.map((p: any) => ({
    ...p,
    premium: formatCurrency(p.premium),
    expirationDate: formatDate(p.expirationDate),
    daysUntilRenewal: calculateDaysUntil(p.expirationDate),
  }));
}

export async function getClients(agencyId: string, options?: { limit?: number; offset?: number }) {
  // Verify user has access to this agency
  const authResult = await requireAgencyAuth();
  if (authResult.agencyId !== agencyId) {
    throw new Error('Forbidden: You do not have access to this agency');
  }

  if (!db) {
    throw new Error('Database not connected');
  }

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
      createdAt: clients.createdAt,
    })
    .from(clients)
    .where(eq(clients.agencyId, agencyId))
    .orderBy(desc(clients.updatedAt))
    .limit(limit)
    .offset(offset)
    .execute();

  // Get policy counts and premiums for each client
  const clientsWithStats = await Promise.all(
    clientList.map(async (client: any) => {
      const policiesList = await db
        .select({
          id: policies.id,
          premium: policies.premium,
          status: policies.status,
          healthScore: policies.healthScore,
          healthStatus: policies.healthStatus,
        })
        .from(policies)
        .where(eq(policies.clientId, client.id));

      const totalPolicies = policiesList.length;
      const totalPremium = policiesList.reduce((sum: number, p: any) => sum + parseFloat(p.premium || '0'), 0);
      const avgHealthScore = totalPolicies > 0
        ? Math.round(policiesList.reduce((sum: number, p: any) => sum + (p.healthScore || 0), 0) / totalPolicies)
        : 0;
      
      // Determine health status based on average score
      let healthStatus = 'healthy';
      if (avgHealthScore < 40) healthStatus = 'at-risk';
      else if (avgHealthScore < 70) healthStatus = 'warning';

      return {
        ...client,
        totalPolicies,
        totalPremium: formatCurrency(totalPremium.toString()),
        healthScore: avgHealthScore,
        healthStatus,
      };
    })
  );

  return clientsWithStats;
}

export async function getPolicyDetails(policyId: string) {
  // Require authentication
  const authResult = await requireAgencyAuth();
  
  if (!db) {
    throw new Error('Database not connected');
  }

  const policy = await db
    .select()
    .from(policies)
    .where(eq(policies.id, policyId))
    .then((p: any[]) => p[0]);

  if (!policy) return null;
  
  // Verify user has access to this policy's agency
  if (policy.agencyId !== authResult.agencyId) {
    throw new Error('Forbidden: You do not have access to this policy');
  }

  const client = await db
    .select()
    .from(clients)
    .where(eq(clients.id, policy.clientId))
    .then((c: any[]) => c[0]);

  const premiumChange = policy.previousTermPremium && policy.currentTermPremium
    ? (((parseFloat(policy.currentTermPremium) - parseFloat(policy.previousTermPremium)) / parseFloat(policy.previousTermPremium)) * 100).toFixed(1)
    : '0';

  return {
    policy,
    client,
    premiumChange: parseFloat(premiumChange),
  };
}

export async function getRenewalsList(agencyId: string, status?: string) {
  // Verify user has access to this agency
  const authResult = await requireAgencyAuth();
  if (authResult.agencyId !== agencyId) {
    throw new Error('Forbidden: You do not have access to this agency');
  }
  
  if (!db) {
    throw new Error('Database not connected');
  }
  
  const renewalList = await db
    .select({
      id: renewals.id,
      policyId: renewals.policyId,
      renewalDate: renewals.renewalDate,
      status: renewals.status,
      notification90Sent: renewals.notification90Sent,
      notification60Sent: renewals.notification60Sent,
      notification30Sent: renewals.notification30Sent,
      aiReportGenerated: renewals.aiReportGenerated,
      aiReportSent: renewals.aiReportSent,
      policyNumber: policies.policyNumber,
      policyType: policies.policyType,
      carrier: policies.carrier,
      premium: policies.premium,
      clientName: clients.name,
    })
    .from(renewals)
    .innerJoin(policies, eq(renewals.policyId, policies.id))
    .innerJoin(clients, eq(policies.clientId, clients.id))
    .where(eq(renewals.agencyId, agencyId))
    .orderBy(renewals.renewalDate)
    .execute();

  // Handle empty result
  if (!renewalList || renewalList.length === 0) {
    return [];
  }

  return renewalList.map((r: any) => ({
    ...r,
    premium: formatCurrency(r.premium),
    renewalDate: formatDate(r.renewalDate),
  }));
}

export async function getCommissions(agencyId: string) {
  // Verify user has access to this agency
  const authResult = await requireAgencyAuth();
  if (authResult.agencyId !== agencyId) {
    throw new Error('Forbidden: You do not have access to this agency');
  }
  
  if (!db) {
    throw new Error('Database not connected');
  }

  const commissionList = await db
    .select({
      id: commissions.id,
      policyNumber: policies.policyNumber,
      policyType: policies.policyType,
      totalPremium: commissions.totalPremium,
      commissionRate: commissions.commissionRate,
      commissionAmount: commissions.commissionAmount,
      agentSplit: commissions.agentSplit,
      agentCommission: commissions.agentCommission,
      carrierPayoutStatus: commissions.carrierPayoutStatus,
      period: commissions.period,
      clientName: clients.name,
    })
    .from(commissions)
    .innerJoin(policies, eq(commissions.policyId, policies.id))
    .innerJoin(clients, eq(policies.clientId, clients.id))
    .where(eq(commissions.agencyId, agencyId))
    .orderBy(desc(commissions.createdAt))
    .limit(50)
    .execute();

  return commissionList.map((c: any) => ({
    ...c,
    totalPremium: formatCurrency(c.totalPremium),
    commissionAmount: formatCurrency(c.commissionAmount),
    agentCommission: c.agentCommission ? formatCurrency(c.agentCommission) : null,
  }));
}

export async function toggleMockData(agencyId: string, enabled: boolean) {
  // This feature is no longer supported in live mode
  return { success: false, error: 'Mock data mode is only available in demo' };
}

export async function checkMockDataStatus(agencyId: string) {
  if (!db) {
    return { hasData: false };
  }

  const clientCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(clients)
    .where(eq(clients.agencyId, agencyId))
    .then((r: any[]) => r[0]?.count || 0);

  return { hasData: clientCount > 0 };
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
  // Require authentication and verify ownership
  const authResult = await requireAgencyAuth();
  
  if (!db) {
    throw new Error('Database not connected');
  }
  
  // Get policy to verify ownership
  const policy = await db
    .select({ agencyId: policies.agencyId })
    .from(policies)
    .where(eq(policies.id, policyId))
    .then((p: any[]) => p[0]);
  
  if (!policy) {
    throw new Error('Policy not found');
  }
  
  if (policy.agencyId !== authResult.agencyId) {
    throw new Error('Forbidden: You do not have access to this policy');
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

export async function getAgency(agencyId: string) {
  // Verify user has access to this agency
  const authResult = await requireAgencyAuth();
  if (authResult.agencyId !== agencyId) {
    throw new Error('Forbidden: You do not have access to this agency');
  }
  
  if (!db) {
    throw new Error('Database not connected');
  }

  return db
    .select()
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .then((a: any[]) => a[0]);
}

export async function createAgency(data: {
  name: string;
  subdomain?: string;
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  tier?: string;
}) {
  // Require authentication
  const authResult = await requireAuth();
  
  // Verify the userId matches the authenticated user
  if (data.userId !== authResult.userId) {
    throw new Error('Forbidden: Cannot create agency for another user');
  }
  
  if (!db) {
    throw new Error('Database not connected');
  }

  const { name, subdomain, userId, email, firstName, lastName, tier } = data;

  // Generate a default subdomain from agency name if not provided
  // Only used internally - enterprise users can set a custom one later
  const defaultSubdomain = subdomain || name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30) + '-' + Math.random().toString(36).substring(2, 8);

  // Get selected tier from data (passed from onboarding)
  const selectedTier = tier && ['solo', 'growth', 'enterprise'].includes(tier) ? tier : 'solo';

  // Create the agency with trial period (trial starts after payment)
  // Set trialEnd to null initially - will be set by Paddle webhook after payment
  const [agency] = await db
    .insert(agencies)
    .values({
      name,
      subdomain: defaultSubdomain.toLowerCase(),
      subscriptionTier: selectedTier,
      subscriptionStatus: 'trialing',
      trialEnd: null, // Will be set by Paddle webhook after successful payment
    })
    .returning();

  // Check if user exists
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (existingUser) {
    // Update existing user
    await db
      .update(users)
      .set({ agencyId: agency.id })
      .where(eq(users.id, userId));
  } else {
    // Create new user as owner (agency creator)
    await db
      .insert(users)
      .values({
        id: userId,
        email: email || '',
        firstName: firstName || null,
        lastName: lastName || null,
        agencyId: agency.id,
        role: 'owner',
      });
  }

  revalidatePath('/dashboard');
  return { success: true, agency };
}

export async function getPolicyLeakageRisk(agencyId: string) {
  // Verify user has access to this agency
  const authResult = await requireAgencyAuth();
  if (authResult.agencyId !== agencyId) {
    throw new Error('Forbidden: You do not have access to this agency');
  }
  
  if (!db) {
    throw new Error('Database not connected');
  }

  // Get all active policies with client and renewal data
  const allPolicies = await db
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
    })
    .from(policies)
    .innerJoin(clients, eq(policies.clientId, clients.id))
    .where(and(eq(policies.agencyId, agencyId), eq(policies.status, 'active')))
    .execute();

  const now = new Date();
  const riskData = allPolicies.map((p: any) => {
    const daysUntilRenewal = calculateDaysUntil(p.expirationDate);
    const premium = parseFloat(p.premium || '0');
    const currentPremium = parseFloat(p.currentTermPremium || p.premium || '0');
    const previousPremium = parseFloat(p.previousTermPremium || '0');
    
    // Calculate premium change percentage
    const premiumChange = previousPremium > 0 
      ? ((currentPremium - previousPremium) / previousPremium) * 100 
      : 0;
    
    // Risk factors (each factor contributes to risk score 0-100)
    let riskScore = 0;
    const riskFactors: string[] = [];
    
    // 1. Days until renewal (higher risk if closer)
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
    
    // 2. Premium increase (higher risk if large increase)
    if (premiumChange > 30) {
      riskScore += 30;
      riskFactors.push(`Premium increased ${premiumChange.toFixed(1)}%`);
    } else if (premiumChange > 15) {
      riskScore += 20;
      riskFactors.push(`Premium increased ${premiumChange.toFixed(1)}%`);
    } else if (premiumChange > 5) {
      riskScore += 10;
      riskFactors.push(`Premium increased ${premiumChange.toFixed(1)}%`);
    }
    
    // 3. Health score (lower score = higher risk)
    if (p.healthScore && p.healthScore < 40) {
      riskScore += 20;
      riskFactors.push(`Low health score: ${p.healthScore}`);
    } else if (p.healthScore && p.healthScore < 70) {
      riskScore += 10;
      riskFactors.push(`Medium health score: ${p.healthScore}`);
    }
    
    // 4. High-value policies (more to lose)
    if (premium > 20000) {
      riskScore += 10;
      riskFactors.push(`High-value policy: $${premium.toLocaleString()}`);
    }
    
    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);
    
    // Determine risk level
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
      riskLevel,
      riskFactors,
      potentialLoss: premium,
    };
  });
  
  // Sort by risk score (highest first)
  riskData.sort((a: any, b: any) => b.riskScore - a.riskScore);
  
  // Calculate summary statistics
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
    policies: riskData.slice(0, 50), // Top 50 highest risk
    summary,
  };
}
