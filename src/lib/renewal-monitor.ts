import { db } from '@/lib/db';
import { policies, users, notifications } from '@/db/schema';
import { eq, lt, gt, and } from 'drizzle-orm';
import { createPolicyRenewalNotification } from '@/lib/notifications';

export async function checkRenewalNotifications() {
  if (!db) return;

  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  // Find policies expiring in next 30 days
  const expiringPolicies = await db
    .select({
      policyId: policies.id,
      agencyId: policies.agencyId,
      clientId: policies.clientId,
      carrier: policies.carrier,
      policyNumber: policies.policyNumber,
      expirationDate: policies.expirationDate,
    })
    .from(policies)
    .where(and(
      gt(policies.expirationDate, today),
      lt(policies.expirationDate, thirtyDaysFromNow)
    ));

  // Group by agency
  const policiesByAgency = expiringPolicies.reduce((acc: Record<string, any[]>, policy: any) => {
    if (!acc[policy.agencyId]) {
      acc[policy.agencyId] = [];
    }
    acc[policy.agencyId].push(policy);
    return acc;
  }, {} as Record<string, any[]>);

  // Create notifications for each agency
  for (const [agencyId, agencyPolicies] of Object.entries(policiesByAgency) as [string, any[]][]) {
    // Check notification settings
    const { getAgencyNotificationSettings, isNotificationEnabled } = await import('@/lib/notification-settings');
    const settings = await getAgencyNotificationSettings(agencyId);


    if (!isNotificationEnabled(settings, 'autoRenewalAlerts')) {
      console.log(`Renewal notifications disabled for agency ${agencyId}`);
      continue;
    }

    // Get all users in agency (owners and admins)
    const agencyUsers = await db
      .select()
      .from(users)
      .where(eq(users.agencyId, agencyId));

    // Filter to owners and admins
    const notifyUsers = agencyUsers.filter((u: any) => u.role === 'owner' || u.role === 'admin');

    // Calculate days until expiration for the earliest policy
    const earliestExpiration = agencyPolicies.reduce((earliest: number, policy: any) => {
      const days = Math.ceil((policy.expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return days < earliest ? days : earliest;
    }, Infinity);

    // Create notification for each relevant user
    for (const user of notifyUsers) {
      // Check for duplicate notification (within last 24 hours)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const existingNotification = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.agencyId, agencyId),
            eq(notifications.userId, user.id),
            eq(notifications.type, 'warning'),
            gt(notifications.createdAt, twentyFourHoursAgo)
          )
        )
        .limit(1)
        .then((r: any[]) => r[0]);

      // Skip if duplicate exists
      if (existingNotification) {
        continue;
      }

      await createPolicyRenewalNotification(
        agencyId,
        user.id,
        agencyPolicies.length,
        earliestExpiration
      );
    }
  }
}

// Run this daily via cron job or scheduled function
export async function runRenewalCheck() {
  try {
    await checkRenewalNotifications();
    console.log('Renewal notifications check completed');
  } catch (error) {
    console.error('Error checking renewal notifications:', error);
  }
}
