/**
 * Real-time Policy Expiration Alerts
 * Prevents silent churn by alerting agents before policies lapse
 */

import { db } from '@/lib/db';
import { policies, clients, users, agencies } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { Resend } from 'resend';
import { sendCampaign, emailTemplates } from '@/lib/email-campaigns';

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
  if (!resend) return;

  // Get agency owner email
  const agency = await db
    .select()
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .limit(1)
    .then((r: any[]) => r[0]);

  const agent = await db
    .select()
    .from(users)
    .where(eq(users.agencyId, agencyId))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!agent?.email) return;

  const urgencyColors = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
  };

  await resend.emails.send({
    from: 'BookGuard <noreply@bookguard.tech>',
    to: agent.email,
    subject: `${urgencyColors[alert.urgency]} Policy Expiring Soon: ${alert.policyNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: ${alert.urgency === 'critical' ? '#dc2626' : alert.urgency === 'high' ? '#ea580c' : '#22c55e'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0;">${urgencyColors[alert.urgency]} Policy Expiration Alert</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <h2 style="color: #374151;">${alert.policyNumber}</h2>
          <p style="color: #6b7280; margin: 0 0 20px 0;">
            Insured: <strong>${alert.insuredName}</strong><br>
            Expires: <strong>${alert.expirationDate.toLocaleDateString()}</strong> (${alert.daysUntilExpiration} days)<br>
            Premium: <strong>$${alert.premium}</strong>
          </p>
          <p style="color: #374151; margin-bottom: 20px;">
            <strong>Urgency:</strong> ${alert.urgency.toUpperCase()}
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/policies/${alert.policyId}" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            View Policy
          </a>
        </div>
      </div>
    `,
  });
}

/**
 * Send automated expiration reminder to insured
 */
export async function sendInsuredReminder(alert: ExpirationAlert) {
  if (!resend) return;

  const template = emailTemplates.find(t => t.id === 'renewal_reminder_30_days');
  if (!template) return;

  await resend.emails.send({
    from: 'BookGuard <noreply@bookguard.tech>',
    to: alert.email,
    subject: `Your policy renewal is approaching - ${alert.daysUntilExpiration} days`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #22c55e; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0;">Policy Renewal Reminder</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <p style="color: #374151;">
            Dear ${alert.insuredName},
          </p>
          <p style="color: #374151;">
            Your policy <strong>${alert.policyNumber}</strong> is set to expire on <strong>${alert.expirationDate.toLocaleDateString()}</strong>.
          </p>
          <p style="color: #374151;">
            That's <strong>${alert.daysUntilExpiration} days</strong> from now. We want to ensure you have continuous coverage without any gaps.
          </p>
          <p style="color: #374151;">
            If you have any questions or would like to discuss coverage options, please don't hesitate to reach out.
          </p>
          <p style="color: #6b7280;">
            Best regards,<br>
            Your Insurance Team
          </p>
        </div>
      </div>
    `,
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
        await sendInsuredReminder(alert);
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
  console.log('Expiration checks scheduled via Inngest for agency:', agencyId);
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
