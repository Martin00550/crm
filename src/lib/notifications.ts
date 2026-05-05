/**
 * Notification system utilities
 *
 * userId convention: Always use Better Auth user ID
 * This is the ID returned by getAuth() and used consistently across the app.
 */
'use server';

import { db } from '@/lib/db';
import { notifications } from '@/db/schema';
import { logger } from '@/lib/logger';
import { eq } from 'drizzle-orm';

export async function createNotification({
  agencyId,
  userId,
  title,
  message,
  type,
  metadata = null,
}: {
  agencyId: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  metadata?: any;
}) {
  if (!db) return { success: false, error: 'Database not connected' };

  try {
    const result = await db
      .insert(notifications)
      .values({
        agencyId,
        userId,
        title,
        message,
        type,
        metadata,
        read: false,
      })
      .returning()
      .then((r: any[]) => r[0]);

    return { success: true, notification: result };
  } catch (error) {
    logger.error('Error creating notification', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

// Specific notification creators for common events
export async function createPolicyRenewalNotification(
  agencyId: string,
  userId: string,
  policyCount: number,
  daysUntilRenewal: number
) {
  return createNotification({
    agencyId,
    userId,
    title: 'Policy Renewal Alert',
    message: `${policyCount} policy${policyCount > 1 ? 's' : ''} expiring in the next ${daysUntilRenewal} days require attention`,
    type: daysUntilRenewal <= 30 ? 'warning' : 'info',
    metadata: {
      type: 'policy_renewal',
      policyCount,
      daysUntilRenewal,
    },
  });
}

export async function createCommissionPaymentNotification(
  agencyId: string,
  userId: string,
  amount: number,
  paymentDate: Date
) {
  return createNotification({
    agencyId,
    userId,
    title: 'Commission Payment Processed',
    message: `Your monthly commission of $${amount.toLocaleString()} has been processed`,
    type: 'success',
    metadata: {
      type: 'commission_payment',
      amount,
      paymentDate,
    },
  });
}

export async function createRateChangeNotification(
  agencyId: string,
  userId: string,
  carrier: string,
  adjustmentType: string
) {
  return createNotification({
    agencyId,
    userId,
    title: 'Rate Change Notification',
    message: `${carrier} announced new premium ${adjustmentType} for Q4`,
    type: 'info',
    metadata: {
      type: 'rate_change',
      carrier,
      adjustmentType,
    },
  });
}

export async function createPolicyUpdateNotification(
  agencyId: string,
  userId: string,
  carrier: string,
  updateType: string
) {
  return createNotification({
    agencyId,
    userId,
    title: 'Policy Update Available',
    message: `New policy ${updateType} from ${carrier} for Q4 renewals`,
    type: 'info',
    metadata: {
      type: 'policy_update',
      carrier,
      updateType,
    },
  });
}

export async function createTeamInvitationNotification(
  agencyId: string,
  userId: string,
  memberName: string,
  memberEmail: string
) {
  return createNotification({
    agencyId,
    userId,
    title: 'Team Member Invited',
    message: `${memberName} (${memberEmail}) has been invited to join your team`,
    type: 'info',
    metadata: {
      type: 'team_invitation',
      memberName,
      memberEmail,
    },
  });
}

export async function createTeamMemberJoinedNotification(
  agencyId: string,
  userId: string,
  memberName: string,
  memberRole: string
) {
  return createNotification({
    agencyId,
    userId,
    title: 'New Team Member',
    message: `${memberName} has joined the team as ${memberRole}`,
    type: 'success',
    metadata: {
      type: 'team_member_joined',
      memberName,
      memberRole,
    },
  });
}
