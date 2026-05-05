'use server';

import webpush from 'web-push';
import { db } from '@/lib/db';
import { notificationSettings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// Configure VAPID keys (should be set in environment variables)
// Generate these with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@retainvault.tech',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  );
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Send a push notification to a specific user
 */
export async function sendPushNotification(
  agencyId: string,
  userId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  if (!db) {
    return { success: false, error: 'Database not connected' };
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return { success: false, error: 'Push notifications not configured' };
  }

  try {
    // Get user's push subscription
    const settings = await db
      .select()
      .from(notificationSettings)
      .where(
        and(
          eq(notificationSettings.agencyId, agencyId),
          eq(notificationSettings.userId, userId)
        )
      )
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!settings?.pushEnabled || !settings.pushSubscription) {
      return { success: false, error: 'Push notifications not enabled for user' };
    }

    const subscription = settings.pushSubscription as PushSubscription;

    // Send the notification
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );

    return { success: true };
  } catch (error) {
    logger.error('Push notification error', error);

    // If subscription is invalid, disable push for this user
    if (typeof error === 'object' && error !== null && 'statusCode' in error && (error as any).statusCode === 410) {
      if (db) {
        await db
          .update(notificationSettings)
          .set({
            pushEnabled: false,
            pushSubscription: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(notificationSettings.agencyId, agencyId),
              eq(notificationSettings.userId, userId)
            )
          );
      }
    }

    return { success: false, error: error instanceof Error ? error.message : 'Failed to send notification' };
  }
}

/**
 * Send push notification to all enabled users in an agency
 */
export async function sendAgencyPushNotification(
  agencyId: string,
  payload: PushNotificationPayload
): Promise<{ success: boolean; sent: number; failed: number }> {
  if (!db || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return { success: false, sent: 0, failed: 0 };
  }

  const results = { sent: 0, failed: 0 };

  try {
    // Get all users with push enabled for this agency
    const users = await db
      .select()
      .from(notificationSettings)
      .where(
        and(
          eq(notificationSettings.agencyId, agencyId),
          eq(notificationSettings.pushEnabled, true)
        )
      );

    for (const user of users) {
      if (!user.userId) continue;
      const result = await sendPushNotification(agencyId, user.userId, payload);
      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
      }
    }

    return { success: true, ...results };
  } catch (error) {
    console.error('Agency push notification error:', error);
    return { success: false, ...results };
  }
}

/**
 * Get VAPID public key for client-side subscription
 */
export async function getVapidPublicKey(): Promise<string | null> {
  return VAPID_PUBLIC_KEY || null;
}
