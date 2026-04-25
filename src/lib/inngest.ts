import { inngest } from '@/lib/inngest-client';
import { db } from '@/lib/db';
import { policies, users, agencies } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { getAgencyNotificationSettings, isNotificationEnabled } from '@/lib/notification-settings';

/**
 * Renewal Automation Engine
 */
export const renewalAutomation = (inngest as any).createFunction(
  {
    id: 'renewal-automation',
    name: '90-60-30 Day Renewal Engine',
    triggers: [{ cron: '0 9 * * *' }],
  },
  async ({ step }: { step: any }) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const checkDates = [
      { days: 90, date: new Date(new Date().setDate(now.getDate() + 90)) },
      { days: 60, date: new Date(new Date().setDate(now.getDate() + 60)) },
      { days: 30, date: new Date(new Date().setDate(now.getDate() + 30)) },
    ];

    const results = { processed: 0, alertsSent: 0 };

    for (const { days, date } of checkDates) {
      date.setHours(0, 0, 0, 0);
      
      const expiringPolicies = await step.run(`get-expiring-${days}`, async () => {
        return await db
          .select()
          .from(policies)
          .where(
            and(
              eq(policies.status, 'active'),
              eq(policies.expirationDate, date)
            )
          );
      });

      for (const policy of expiringPolicies) {
        await step.run(`process-policy-${policy.id}-${days}`, async () => {
          const settings = await getAgencyNotificationSettings(policy.agencyId);
          const enabledKey = days === 90 ? 'email90Day' : days === 60 ? 'email60Day' : 'email30Day';
          
          if (isNotificationEnabled(settings, enabledKey as any)) {
            const { createPolicyRenewalNotification } = await import('@/lib/notifications');
            
            const owner = await db
              .select()
              .from(users)
              .where(and(eq(users.agencyId, policy.agencyId), eq(users.role, 'owner')))
              .limit(1)
              .then((r: any[]) => r[0]);

            if (owner) {
              await createPolicyRenewalNotification(policy.agencyId, owner.id, 1, days);
              results.alertsSent++;
            }
          }
        });
        results.processed++;
      }
    }

    return results;
  }
);

/**
 * Health Score Updater
 */
export const healthScoreUpdater = (inngest as any).createFunction(
  {
    id: 'health-score-updater',
    name: 'Policy Health Score Updater',
    triggers: [{ cron: '0 3 * * *' }],
  },
  async ({ step }: { step: any }) => {
    const activePolicies = await db
      .select()
      .from(policies)
      .where(eq(policies.status, 'active'));

    const results = { processed: 0, updated: 0 };

    for (const policy of activePolicies) {
      await step.run(`update-health-${policy.id}`, async () => {
        const { calculatePolicyRiskScore } = await import('@/lib/predictive-analytics');
        const score = await calculatePolicyRiskScore(policy, null);
        
        let status: 'healthy' | 'at-risk' | 'critical' = 'healthy';
        if (score < 40) status = 'critical';
        else if (score < 70) status = 'at-risk';

        await db
          .update(policies)
          .set({ 
            healthScore: score,
            healthStatus: status,
            updatedAt: new Date()
          })
          .where(eq(policies.id, policy.id));
        
        results.updated++;
      });
      results.processed++;
    }

    return results;
  }
);

/**
 * AI Rate Explainer Generator
 */
export const rateExplainerGenerator = (inngest as any).createFunction(
  {
    id: 'rate-explainer-generator',
    name: 'AI Rate Explainer Generator',
    triggers: [{ event: 'rate/explainer.requested' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { policyId } = event.data;
    
    const policy = await db
      .select()
      .from(policies)
      .where(eq(policies.id, policyId))
      .then((r: any[]) => r[0]);

    if (!policy) return { success: false, error: 'Policy not found' };

    const explanation = await step.run('generate-explanation', async () => {
      const { generateRateExplanation } = await import('@/lib/ai-service');
      return await generateRateExplanation(policyId);
    });

    await step.run('store-explanation', async () => {
      await db
        .update(policies)
        .set({ 
          metadata: sql`jsonb_set(COALESCE(${policies.metadata}, '{}'::jsonb), '{rateExplanation}', ${JSON.stringify(explanation)}::jsonb)`
        })
        .where(eq(policies.id, policyId));
    });

    return { success: true, policyId };
  }
);

/**
 * Manual Renewal Notification Sender
 */
export const manualRenewalNotification = (inngest as any).createFunction(
  {
    id: 'manual-renewal-notification',
    name: 'Manual Renewal Notification Sender',
    triggers: [{ event: 'renewal.notification.manual' }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { policyId, daysOut } = event.data;

    const policy = await db
      .select()
      .from(policies)
      .where(eq(policies.id, policyId))
      .then((r: any[]) => r[0]);

    if (!policy) return { success: false, error: 'Policy not found' };

    await step.run('send-manual-notification', async () => {
      const { createPolicyRenewalNotification } = await import('@/lib/notifications');
      
      const owner = await db
        .select()
        .from(users)
        .where(and(eq(users.agencyId, policy.agencyId), eq(users.role, 'owner')))
        .limit(1)
        .then((r: any[]) => r[0]);

      if (owner) {
        await createPolicyRenewalNotification(policy.agencyId, owner.id, 1, daysOut);
      }
    });

    return { success: true };
  }
);

/**
 * Weekly Intelligence Report
 */
export const weeklyIntelligenceReport = (inngest as any).createFunction(
  {
    id: 'weekly-intelligence-report',
    name: 'Weekly Intelligence Report Generator',
    triggers: [{ cron: '0 9 * * 1' }],
  },
  async ({ step }: { step: any }) => {
    const allAgencies = await db
      .select()
      .from(agencies)
      .where(eq(agencies.subscriptionStatus, 'active'));

    const results = { processed: 0, sent: 0, skipped: 0 };

    for (const agency of allAgencies) {
      const shouldSend = await step.run(`check-settings-${agency.id}`, async () => {
        const settings = await getAgencyNotificationSettings(agency.id);
        return isNotificationEnabled(settings, 'weeklyReports');
      });

      if (shouldSend) {
        const reportData = await step.run(`generate-report-${agency.id}`, async () => {
          const agencyPolicies = await db.select().from(policies).where(eq(policies.agencyId, agency.id));
          const now = new Date();
          
          const totalPremium = agencyPolicies.reduce((sum: number, p: any) => sum + (parseFloat(p.premium) || 0), 0);
          
          const renewalsUpcoming = agencyPolicies.filter((p: any) => {
            const daysUntil = Math.ceil((new Date(p.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntil > 0 && daysUntil <= 90;
          }).length;

          const policiesAtRisk = agencyPolicies.filter((p: any) => p.healthStatus === 'at-risk').length;

          return { totalPremium, renewalsUpcoming, policiesAtRisk, policiesCount: agencyPolicies.length };
        });

        await step.run(`deliver-report-${agency.id}`, async () => {
          const owner = await db
            .select()
            .from(users)
            .where(and(eq(users.agencyId, agency.id), eq(users.role, 'owner')))
            .limit(1)
            .then((r: any[]) => r[0]);

          if (owner) {
            const { createNotification } = await import('@/lib/notifications');
            await createNotification({
              agencyId: agency.id,
              userId: owner.id,
              title: 'Weekly Intelligence Report',
              message: `Book of Business: $${reportData.totalPremium.toLocaleString()} | ${reportData.renewalsUpcoming} renewals in 90 days | ${reportData.policiesAtRisk} policies at risk`,
              type: 'info',
              metadata: {
                type: 'weekly_report',
                ...reportData
              },
            });

            const settings = await getAgencyNotificationSettings(agency.id);
            if (settings && settings.emailNotifications && owner.email) {
              const { sendWeeklyReportEmail } = await import('@/lib/email');
              await sendWeeklyReportEmail(owner.email, agency.name, reportData);
            }
          }
        });

        results.sent++;
      } else {
        results.skipped++;
      }
      results.processed++;
    }

    return results;
  }
);

export const functions = [renewalAutomation, healthScoreUpdater, rateExplainerGenerator, manualRenewalNotification, weeklyIntelligenceReport];
