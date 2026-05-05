import { createNotification } from './notifications';
import { sendPushNotification } from './push-notifications';
import { getNotificationSettings, isNotificationEnabled } from './notification-settings';
import { db } from './db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from './logger';

export type NotificationEvent = 
  | { type: 'policy_renewal'; policyId: string; policyNumber: string; daysOut: number; premium: string; clientName: string; clientEmail?: string | null }
  | { type: 'insured_reminder'; policyId: string; policyNumber: string; daysOut: number; clientName: string; clientEmail: string }
  | { type: 'team_member_joined'; memberName: string; memberRole: string }
  | { type: 'team_invitation'; memberName: string; memberEmail: string }
  | { type: 'commission_payment'; amount: number; paymentDate: Date }
  | { type: 'rate_change'; carrier: string; adjustmentType: string };

/**
 * Unified Notification Dispatcher
 * The single entry point for all system alerts. Handles DB, Push, and Email.
 */
export async function dispatchNotification(
  agencyId: string,
  userId: string,
  event: NotificationEvent
) {
  try {
    // 1. Fetch user settings and email
    const [settings, user] = await Promise.all([
      getNotificationSettings(agencyId, userId),
      db?.query.users.findFirst({
        where: eq(users.id, userId),
      })
    ]);

    if (!user) {
      logger.error('Cannot dispatch notification: User not found', { userId });
      return;
    }

    // 2. Map event to content
    const { title, message, alertType } = mapEventToContent(event);

    // 3. Create in-app notification (Database) - Only for non-insured events
    let dbResult = null;
    if (event.type !== 'insured_reminder') {
      dbResult = await createNotification({
        agencyId,
        userId,
        title,
        message,
        type: alertType,
        metadata: event,
      });
    }

    // 4. Handle Push Notification (if enabled) - Only for agent-facing events
    if (event.type !== 'insured_reminder' && isNotificationEnabled(settings, 'pushNotifications')) {
      await sendPushNotification(agencyId, userId, {
        title,
        body: message,
        data: { url: getEventUrl(event) },
      });
    }

    // 5. Handle Email Notification
    await handleEmailDispatch(agencyId, user, event, settings);

    return dbResult;
  } catch (error) {
    logger.error('Failed to dispatch notification', { agencyId, userId, event, error });
  }
}

function mapEventToContent(event: NotificationEvent): { title: string; message: string; alertType: 'info' | 'warning' | 'success' | 'error' } {
  switch (event.type) {
    case 'policy_renewal':
      return {
        title: 'Policy Renewal Alert',
        message: `Policy ${event.policyNumber} for ${event.clientName} expires in ${event.daysOut} days.`,
        alertType: event.daysOut <= 30 ? 'warning' : 'info',
      };
    case 'insured_reminder':
      return {
        title: 'Insured Reminder',
        message: `Renewal reminder sent to ${event.clientName} for policy ${event.policyNumber}.`,
        alertType: 'info',
      };
    case 'team_member_joined':
      return {
        title: 'New Team Member',
        message: `${event.memberName} has joined as ${event.memberRole}.`,
        alertType: 'success',
      };
    case 'team_invitation':
      return {
        title: 'Team Invitation Sent',
        message: `Invitation dispatched to ${event.memberName} (${event.memberEmail}).`,
        alertType: 'info',
      };
    case 'commission_payment':
      return {
        title: 'Commission Processed',
        message: `Payment of $${event.amount.toLocaleString()} is scheduled for ${event.paymentDate.toLocaleDateString()}.`,
        alertType: 'success',
      };
    case 'rate_change':
      return {
        title: 'Rate Change Alert',
        message: `${event.carrier} announced a ${event.adjustmentType} adjustment.`,
        alertType: 'info',
      };
    default:
      return {
        title: 'System Alert',
        message: 'New activity in your agency command center.',
        alertType: 'info',
      };
  }
}

function getEventUrl(event: NotificationEvent): string {
  switch (event.type) {
    case 'policy_renewal': return `/dashboard/policies/${event.policyId}`;
    case 'team_member_joined': return '/dashboard/settings/team';
    case 'commission_payment': return '/dashboard/commissions';
    default: return '/dashboard';
  }
}

async function handleEmailDispatch(
  agencyId: string, 
  user: any, 
  event: NotificationEvent, 
  settings: any
) {
  const { 
    sendAgentRenewalAlertEmail, 
    sendTeamJoinEmail, 
    sendCommissionEmail,
    sendInsuredReminderEmail 
  } = await import('./email');

  // Handle Insured Reminders (Always attempt if it's the right event)
  if (event.type === 'insured_reminder' && event.clientEmail) {
    await sendInsuredReminderEmail(event.clientEmail, {
      policyNumber: event.policyNumber,
      clientName: event.clientName,
      daysOut: event.daysOut,
    });
    return;
  }

  // Handle Agent Emails (Respect settings)
  if (!user.email || !isNotificationEnabled(settings, 'emailNotifications')) return;

  switch (event.type) {
    case 'policy_renewal':
      const { isEmailNotificationEnabled } = await import('./notification-settings');
      if (isEmailNotificationEnabled(settings, event.daysOut)) {
        await sendAgentRenewalAlertEmail(user.email, {
          policyNumber: event.policyNumber,
          clientName: event.clientName,
          daysOut: event.daysOut,
          premium: event.premium,
          policyId: event.policyId,
        });
      }
      break;

    case 'commission_payment':
      if (isNotificationEnabled(settings, 'commissionAlerts')) {
        await sendCommissionEmail(user.email, {
          amount: event.amount,
          date: event.paymentDate,
        });
      }
      break;

    case 'team_member_joined':
      await sendTeamJoinEmail(user.email, {
        memberName: event.memberName,
        role: event.memberRole,
      });
      break;
  }
}
