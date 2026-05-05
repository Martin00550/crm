/**
 * Real-time Policy Expiration Alerts
 * Prevents silent leakage by alerting agents before policies lapse
 */

import { db } from '@/lib/db';
import { policies, clients, users, agencies } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { Resend } from 'resend';


const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface ExpirationAlert {
  policyId: string;
  policyNumber: string;
  insuredName: string;
  email: string;
  expirationDate: Date;
  daysUntilExpiration: number;
  premium: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

/**
 * Get policies expiring soon
 */
export async function getExpiringPolicies(
  agencyId: string,
  daysThreshold: number = 30
): Promise<ExpirationAlert[]> {
  const now = new Date();
  const thresholdDate = new Date(now.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

  const expiringPolicies = await db
    .select({
      policy: policies,
      client: clients,
    })
    .from(policies)
    .innerJoin(clients, eq(policies.clientId, clients.id))
    .where(
      and(
        eq(policies.agencyId, agencyId),
        eq(policies.status, 'active'),
        gte(policies.expirationDate, now),
        lte(policies.expirationDate, thresholdDate)
      )
    );

  const alerts: ExpirationAlert[] = expiringPolicies.map(({ policy, client }: { policy: any; client: any }) => {
    const daysUntilExpiration = Math.floor(
      (new Date(policy.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
    if (daysUntilExpiration <= 7) urgency = 'critical';
    else if (daysUntilExpiration <= 14) urgency = 'high';
    else if (daysUntilExpiration <= 30) urgency = 'medium';

    return {
      policyId: policy.id,
      policyNumber: policy.policyNumber,
      insuredName: client.name,
      email: client.email,
      expirationDate: new Date(policy.expirationDate),
      daysUntilExpiration,
      premium: policy.premium,
      urgency,
    };
  });

  // Sort by urgency and days until expiration
  return alerts.sort((a, b) => {
    const urgencyOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return a.daysUntilExpiration - b.daysUntilExpiration;
  });
}

/**
 * Send expiration alert to agent
 */
export async function sendAgentAlert(agencyId: string, alert: ExpirationAlert) {
  // Find the agency owner or primary agent
  const agent = await db
    .select()
    .from(users)
    .where(and(eq(users.agencyId, agencyId), eq(users.role, 'owner')))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!agent) {
    logger.warn('No owner found to receive expiration alert', { agencyId, policyId: alert.policyId });
    return;
  }

  const { dispatchNotification } = await import('@/lib/notification-dispatcher');
  await dispatchNotification(agencyId, agent.id, {
    type: 'policy_renewal',
    policyId: alert.policyId,
    policyNumber: alert.policyNumber,
    daysOut: alert.daysUntilExpiration,
    premium: alert.premium,
    clientName: alert.insuredName,
    clientEmail: alert.email,
  });
}

/**
 * Send automated expiration reminder to insured
 */
export async function sendInsuredReminder(agencyId: string, alert: ExpirationAlert) {
  // We still need an agent/user ID for the dispatcher context, 
  // even if it's an insured reminder (for audit/ownership)
  const agent = await db
    .select()
    .from(users)
    .where(and(eq(users.agencyId, agencyId), eq(users.role, 'owner')))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!agent) return;

  const { dispatchNotification } = await import('@/lib/notification-dispatcher');
  await dispatchNotification(agencyId, agent.id, {
    type: 'insured_reminder',
    policyId: alert.policyId,
    policyNumber: alert.policyNumber,
    daysOut: alert.daysUntilExpiration,
    clientName: alert.insuredName,
    clientEmail: alert.email,
  });
}

/**
 * Send batch alerts for all expiring policies
 */
export async function sendExpirationAlerts(agencyId: string, daysThreshold: number = 30) {
  const alerts = await getExpiringPolicies(agencyId, daysThreshold);

  const results = {
    totalAlerts: alerts.length,
    agentAlertsSent: 0,
    insuredRemindersSent: 0,
    errors: [] as string[],
  };

  for (const alert of alerts) {
    try {
      // Send alert to agent
      await sendAgentAlert(agencyId, alert);
      results.agentAlertsSent++;

      // Send reminder to insured (only for high urgency)
      if (alert.urgency === 'critical' || alert.urgency === 'high') {
        await sendInsuredReminder(agencyId, alert);
        results.insuredRemindersSent++;
      }
    } catch (error) {
      results.errors.push(`Failed to send alert for policy ${alert.policyId}: ${error}`);
    }
  }

  return results;
}

/**
 * Schedule daily expiration check
 */
export async function scheduleExpirationChecks(agencyId: string) {
  // Scheduling is handled by Inngest functions in inngest-schedule.ts
  logger.info('Expiration checks scheduled via Inngest for agency', { agencyId });
}

/**
 * Get expiration alert summary
 */
export async function getExpirationAlertSummary(agencyId: string) {
  const critical = await getExpiringPolicies(agencyId, 7);
  const high = await getExpiringPolicies(agencyId, 14);
  const medium = await getExpiringPolicies(agencyId, 30);

  const criticalVolume = critical.reduce((sum, a) => sum + parseFloat(a.premium), 0);
  const highVolume = high.reduce((sum, a) => sum + parseFloat(a.premium), 0);
  const mediumVolume = medium.reduce((sum, a) => sum + parseFloat(a.premium), 0);

  return {
    critical: {
      count: critical.length,
      volume: criticalVolume.toFixed(2),
    },
    high: {
      count: high.length,
      volume: highVolume.toFixed(2),
    },
    medium: {
      count: medium.length,
      volume: mediumVolume.toFixed(2),
    },
    total: critical.length + high.length + medium.length,
    totalVolume: (criticalVolume + highVolume + mediumVolume).toFixed(2),
  };
}
