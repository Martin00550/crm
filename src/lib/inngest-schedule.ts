/**
 * Inngest Scheduling for Automated Tasks
 * Schedules backup jobs and expiration alert checks
 */

import { inngest } from '@/lib/inngest-client';
import { eq } from 'drizzle-orm';

// Type definitions for Inngest to avoid @ts-ignore
interface InngestStep {
  run: <T>(name: string, fn: () => Promise<T>) => Promise<T>;
}

interface InngestFunctionHandler {
  (context: { step: InngestStep }): Promise<any>;
}

interface InngestFunctionConfig {
  id: string;
  triggers: Array<{ cron: string }>;
}

interface InngestClient {
  createFunction: (config: InngestFunctionConfig, handler: InngestFunctionHandler) => any;
}

/**
 * Daily backup job - runs every day at 2 AM UTC
 */
export const dailyBackupJob = (inngest as InngestClient).createFunction(
  { id: 'daily-backup', triggers: [{ cron: 'TZ=UTC 0 2 * * *' }] },
  async ({ step }: { step: InngestStep }) => {
    const { createDatabaseBackup, scheduleAutomatedBackups } = await import('@/lib/backup');
    
    // Get all active agencies
    const agencies = await step.run('get-agencies', async () => {
      const { db } = await import('@/lib/db');
      const { agencies } = await import('@/db/schema');
      return await db.select().from(agencies).where(eq(agencies.subscriptionStatus, 'active'));
    });

    // Create backups for each agency
    const results = await step.run('create-backups', async () => {
      const backupPromises = agencies.map((agency: any) => createDatabaseBackup(agency.id));
      return await Promise.all(backupPromises);
    });

    return {
      success: true,
      agenciesProcessed: agencies.length,
      backupsCreated: results.filter((r: any) => r.success).length,
      timestamp: new Date(),
    };
  }
);

/**
 * Daily expiration check job - runs every day at 9 AM UTC
 */
export const dailyExpirationCheckJob = (inngest as InngestClient).createFunction(
  { id: 'daily-expiration-check', triggers: [{ cron: 'TZ=UTC 0 9 * * *' }] },
  async ({ step }: { step: InngestStep }) => {
    const { sendExpirationAlerts, scheduleExpirationChecks } = await import('@/lib/expiration-alerts');
    
    // Get all active agencies
    const agencies = await step.run('get-agencies', async () => {
      const { db } = await import('@/lib/db');
      const { agencies } = await import('@/db/schema');
      return await db.select().from(agencies).where(eq(agencies.subscriptionStatus, 'active'));
    });

    // Send expiration alerts for each agency
    const results = await step.run('send-alerts', async () => {
      const alertPromises = agencies.map((agency: any) => sendExpirationAlerts(agency.id, 30));
      return await Promise.all(alertPromises);
    });

    return {
      success: true,
      agenciesProcessed: agencies.length,
      totalAlertsSent: (results as any[]).reduce((sum: number, r: any) => sum + r.totalAlerts, 0),
      agentAlertsSent: (results as any[]).reduce((sum: number, r: any) => sum + r.agentAlertsSent, 0),
      insuredRemindersSent: (results as any[]).reduce((sum: number, r: any) => sum + r.insuredRemindersSent, 0),
      timestamp: new Date(),
    };
  }
);

/**
 * Hourly critical expiration check - runs every hour for policies expiring in 7 days
 */
export const hourlyCriticalCheckJob = (inngest as InngestClient).createFunction(
  { id: 'hourly-critical-check', triggers: [{ cron: 'TZ=UTC 0 * * * *' }] },
  async ({ step }: { step: InngestStep }) => {
    const { sendExpirationAlerts } = await import('@/lib/expiration-alerts');
    
    // Get all active agencies
    const agencies = await step.run('get-agencies', async () => {
      const { db } = await import('@/lib/db');
      const { agencies } = await import('@/db/schema');
      return await db.select().from(agencies).where(eq(agencies.subscriptionStatus, 'active'));
    });

    // Send alerts for critical expirations (7 days or less)
    const results = await step.run('send-critical-alerts', async () => {
      const alertPromises = agencies.map((agency: any) => sendExpirationAlerts(agency.id, 7));
      return await Promise.all(alertPromises);
    });

    return {
      success: true,
      agenciesProcessed: agencies.length,
      criticalAlertsSent: (results as any[]).reduce((sum: number, r: any) => sum + r.agentAlertsSent, 0),
      timestamp: new Date(),
    };
  }
);
