'use server';

import { db } from '@/lib/db';
import { policies, renewals, clients } from '@/db/schema';
import { eq, and, gte, lte, desc, sql, inArray } from 'drizzle-orm';
import { getAuth } from '@/lib/auth-wrapper';
import { getUserAgencyId } from '@/actions/data';
import { logger } from '@/lib/logger';

export interface RenewalPipelineItem {
  id: string;
  policyId: string;
  clientId: string;
  policyNumber: string;
  carrier: string | null;
  policyType: string | null;
  premium: string | null;
  expirationDate: Date;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  status: string | null;
  daysUntilRenewal: number;
  notification90Sent: boolean | null;
  notification60Sent: boolean | null;
  notification30Sent: boolean | null;
  aiReportGenerated: boolean | null;
}

export interface RenewalStats {
  total: number;
  days30: number;
  days60: number;
  days90: number;
  overdue: number;
  completed: number;
  pending: number;
}

// Get renewal pipeline for agency
export async function getRenewalPipeline(agencyId: string): Promise<RenewalPipelineItem[]> {
  if (!db) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const results = await db
    .select({
      id: renewals.id,
      policyId: policies.id,
      clientId: policies.clientId,
      policyNumber: policies.policyNumber,
      carrier: policies.carrier,
      policyType: policies.policyType,
      premium: policies.premium,
      expirationDate: policies.expirationDate,
      clientName: clients.name,
      clientEmail: clients.email,
      clientPhone: clients.phone,
      status: renewals.status,
      notification90Sent: renewals.notification90Sent,
      notification60Sent: renewals.notification60Sent,
      notification30Sent: renewals.notification30Sent,
      aiReportGenerated: renewals.aiReportGenerated,
    })
    .from(renewals)
    .innerJoin(policies, eq(renewals.policyId, policies.id))
    .innerJoin(clients, eq(policies.clientId, clients.id))
    .where(eq(renewals.agencyId, agencyId))
    .orderBy(policies.expirationDate);

  // Return all results to reflect the actual number of policies in the database
  return results.map((r) => {
    const expirationDate = new Date(r.expirationDate);
    const isValidDate = !isNaN(expirationDate.getTime());
    
    return {
      ...r,
      daysUntilRenewal: isValidDate
        ? Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : 0, // Fallback for invalid dates
    };
  });
}

// Get renewal statistics
export async function getRenewalStats(agencyId: string): Promise<RenewalStats> {
  if (!db) {
    return {
      total: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      overdue: 0,
      completed: 0,
      pending: 0,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const day30 = new Date(today);
  day30.setDate(day30.getDate() + 30);

  const day60 = new Date(today);
  day60.setDate(day60.getDate() + 60);

  const day90 = new Date(today);
  day90.setDate(day90.getDate() + 90);

  const rawItems = await db
    .select({
      id: renewals.id,
      policyId: renewals.policyId,
      status: renewals.status,
      expirationDate: policies.expirationDate,
      premium: policies.premium,
      clientName: clients.name,
    })
    .from(renewals)
    .innerJoin(policies, eq(renewals.policyId, policies.id))
    .innerJoin(clients, eq(policies.clientId, clients.id))
    .where(eq(renewals.agencyId, agencyId));

  const items = rawItems;

  const stats: RenewalStats = {
    total: items.length,
    days30: 0,
    days60: 0,
    days90: 0,
    overdue: 0,
    completed: 0,
    pending: 0,
  };

  for (const item of items) {
    if (item.status === 'completed') {
      stats.completed++;
      continue;
    }

    // Count all non-completed items as pending
    stats.pending++;

    const expDate = new Date(item.expirationDate);
    const days = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (days < 0) {
      stats.overdue++;
    } else if (days <= 30) {
      stats.days30++;
    } else if (days <= 60) {
      stats.days60++;
    } else if (days <= 90) {
      stats.days90++;
    }
  }

  return stats;
}

// Manually trigger renewal notification
export async function sendManualRenewalNotification(renewalId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await getAuth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!db) {
      return { success: false, error: 'Database not connected' };
    }

    // Get renewal details
    const renewal = await db
      .select({
        renewal: renewals,
        policy: policies,
        client: clients,
      })
      .from(renewals)
      .innerJoin(policies, eq(renewals.policyId, policies.id))
      .innerJoin(clients, eq(policies.clientId, clients.id))
      .where(eq(renewals.id, renewalId))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!renewal) {
      return { success: false, error: 'Renewal not found' };
    }

    // Calculate days until renewal
    const today = new Date();
    const days = Math.ceil(
      (new Date(renewal.policy.expirationDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Determine which notification to send
    let notificationField: string;
    if (days <= 30) {
      notificationField = 'notification30Sent';
    } else if (days <= 60) {
      notificationField = 'notification60Sent';
    } else {
      notificationField = 'notification90Sent';
    }

    // Send email via Inngest event
    const { inngest } = await import('@/lib/inngest-client');
    await inngest.send({
      name: 'renewal.notification.manual',
      data: {
        renewalId,
        policyId: renewal.policy.id,
        clientId: renewal.client.id,
        daysOut: days,
      },
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to send manual notification', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Update renewal status
export async function updateRenewalStatus(
  renewalId: string,
  status: string,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await getAuth();
    if (!userId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!db) {
      return { success: false, error: 'Database not connected' };
    }

    await db
      .update(renewals)
      .set({
        status,
        notes: notes || undefined,
        updatedAt: new Date(),
        ...(status === 'completed' ? { renewalCompletedAt: new Date() } : {}),
      })
      .where(eq(renewals.id, renewalId));

    return { success: true };
  } catch (error) {
    logger.error('Failed to update renewal status', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Create renewal records for existing policies (migration helper)
export async function createMissingRenewalRecords(): Promise<{ created: number; error?: string }> {
  try {
    const { userId } = await getAuth();
    if (!userId) {
      return { created: 0, error: 'Unauthorized' };
    }

    const agencyId = await getUserAgencyId(userId);
    if (!agencyId) {
      return { created: 0, error: 'No agency found' };
    }

    if (!db) {
      return { created: 0, error: 'Database not connected' };
    }

    // --- SELF-HEALING: Purge any existing duplicates first ---
    const allExistingRenewals = await db
      .select({ 
        id: renewals.id, 
        policyId: renewals.policyId,
        policyType: policies.policyType,
        carrier: policies.carrier,
        premium: policies.premium,
        clientId: policies.clientId
      })
      .from(renewals)
      .innerJoin(policies, eq(renewals.policyId, policies.id))
      .where(eq(renewals.agencyId, agencyId));
    
    const seenPolicies = new Map<string, string>(); // key: composite string, value: first renewal ID
    const seenPolicyIds = new Set<string>();
    const idsToDelete: string[] = [];
    
    for (const r of allExistingRenewals) {
      // 1. Exact Policy ID match (definite duplicate)
      if (seenPolicyIds.has(r.policyId)) {
        idsToDelete.push(r.id);
        continue;
      }
      
      // 2. Fuzzy match (same client, type, carrier, premium)
      const compositeKey = `${r.clientId}-${r.policyType}-${r.carrier}-${r.premium}`;
      if (seenPolicies.has(compositeKey)) {
        idsToDelete.push(r.id);
        continue;
      }
      
      seenPolicyIds.add(r.policyId);
      seenPolicies.set(compositeKey, r.id);
    }
    
    if (idsToDelete.length > 0) {
      for (let i = 0; i < idsToDelete.length; i += 50) {
        const chunk = idsToDelete.slice(i, i + 50);
        await db.delete(renewals).where(inArray(renewals.id, chunk));
      }
    }

    // --- ENROLLMENT: Add policies that aren't in the pipeline yet ---
    const allAgencyPolicies = await db
      .select({ id: policies.id, agencyId: policies.agencyId, expirationDate: policies.expirationDate })
      .from(policies)
      .where(eq(policies.agencyId, agencyId));

    const existingPolicyIds = new Set(allExistingRenewals.map(r => r.policyId));
    const missingPolicies = allAgencyPolicies.filter(p => !existingPolicyIds.has(p.id));

    if (missingPolicies.length > 0) {
      for (const policy of missingPolicies) {
        await db.insert(renewals).values({
          policyId: policy.id,
          agencyId: policy.agencyId,
          renewalDate: policy.expirationDate,
          status: 'pending',
        });
      }
    }

    return { created: missingPolicies.length };
  } catch (error) {
    logger.error('Failed to create renewal records', error);
    return { created: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
