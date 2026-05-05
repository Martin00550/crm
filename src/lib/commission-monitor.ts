import { db } from '@/lib/db';
import { commissions, users, agencies } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { createCommissionPaymentNotification } from '@/lib/notifications';

export async function checkCommissionNotifications() {
  if (!db) return;

  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  // Find commissions processed in last 30 days
  const recentCommissions = await db
    .select({
      commissionId: commissions.id,
      agencyId: commissions.agencyId,
      agentId: commissions.agentId,
      commissionAmount: commissions.commissionAmount,
      carrierPayoutDate: commissions.carrierPayoutDate,
      carrierPayoutStatus: commissions.carrierPayoutStatus,
    })
    .from(commissions)
    .where(and(
      gte(commissions.carrierPayoutDate, thirtyDaysAgo),
      eq(commissions.carrierPayoutStatus, 'paid')
    ));

  // Group by agent
  const commissionsByAgent = recentCommissions.reduce((acc: any, commission: any) => {
    const key = `${commission.agencyId}-${commission.agentId}`;
    if (!acc[key]) {
      acc[key] = {
        agencyId: commission.agencyId,
        agentId: commission.agentId,
        totalAmount: 0,
        commissions: []
      };
    }
    acc[key].totalAmount += parseFloat(commission.commissionAmount);
    acc[key].commissions.push(commission);
    return acc;
  }, {});

  // Create notifications for each agent
  for (const agentData of Object.values(commissionsByAgent) as any[]) {
    // Check notification settings
    const { getAgencyNotificationSettings, isNotificationEnabled } = await import('@/lib/notification-settings');
    const settings = await getAgencyNotificationSettings(agentData.agencyId);


    if (!isNotificationEnabled(settings, 'commissionAlerts')) {
      logger.info('Commission alerts disabled for agency', { agencyId: agentData.agencyId });
      continue;
    }

    await createCommissionPaymentNotification(
      agentData.agencyId,
      agentData.agentId,
      agentData.totalAmount,
      today
    );
  }
}

export async function runCommissionCheck() {
  try {
    await checkCommissionNotifications();
    logger.info('Commission notifications check completed');
  } catch (error) {
    logger.error('Error checking commission notifications', error);
  }
}
