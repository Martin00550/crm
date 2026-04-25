import { db } from '@/lib/db';
import { notificationSettings } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export interface NotificationSettingsType {
  id: string;
  agencyId: string;
  userId: string;
  // Email notifications
  emailNotifications: boolean;
  email90Day: boolean;
  email60Day: boolean;
  email30Day: boolean;
  // Push notifications
  pushNotifications: boolean;
  pushEnabled: boolean;
  pushSubscription: any;
  // Reports
  weeklyReports: boolean;
  weeklyReportDay: number;
  // Auto-renewal alerts
  autoRenewalAlerts: boolean;
  autoRenewalDays: number;
  // Commission alerts
  commissionAlerts: boolean;
}

export const DEFAULT_SETTINGS: Partial<NotificationSettingsType> = {
  emailNotifications: true,
  email90Day: true,
  email60Day: true,
  email30Day: true,
  pushNotifications: false,
  pushEnabled: false,
  pushSubscription: null,
  weeklyReports: true,
  weeklyReportDay: 1,
  autoRenewalAlerts: true,
  autoRenewalDays: 30,
  commissionAlerts: true,
};

/**
 * Get notification settings for a specific user
 */
export async function getNotificationSettings(
  agencyId: string,
  userId: string
): Promise<NotificationSettingsType | null> {
  if (!db) return null;

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

  if (!settings) return null;

  return {
    id: settings.id,
    agencyId: settings.agencyId,
    userId: settings.userId,
    emailNotifications: settings.emailNotifications,
    email90Day: settings.email90Day,
    email60Day: settings.email60Day,
    email30Day: settings.email30Day,
    pushNotifications: settings.pushNotifications,
    pushEnabled: settings.pushEnabled,
    pushSubscription: settings.pushSubscription,
    weeklyReports: settings.weeklyReports,
    weeklyReportDay: settings.weeklyReportDay,
    autoRenewalAlerts: settings.autoRenewalAlerts,
    autoRenewalDays: settings.autoRenewalDays,
    commissionAlerts: settings.commissionAlerts,
  };
}

/**
 * Get notification settings for agency (used by Inngest cron jobs)
 * Returns the first user's settings (typically the owner)
 */
export async function getAgencyNotificationSettings(
  agencyId: string
): Promise<NotificationSettingsType | null> {
  if (!db) return null;

  const settings = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.agencyId, agencyId))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!settings) return null;

  return {
    id: settings.id,
    agencyId: settings.agencyId,
    userId: settings.userId,
    emailNotifications: settings.emailNotifications,
    email90Day: settings.email90Day,
    email60Day: settings.email60Day,
    email30Day: settings.email30Day,
    pushNotifications: settings.pushNotifications,
    pushEnabled: settings.pushEnabled,
    pushSubscription: settings.pushSubscription,
    weeklyReports: settings.weeklyReports,
    weeklyReportDay: settings.weeklyReportDay,
    autoRenewalAlerts: settings.autoRenewalAlerts,
    autoRenewalDays: settings.autoRenewalDays,
    commissionAlerts: settings.commissionAlerts,
  };
}

/**
 * Create or update notification settings
 */
export async function upsertNotificationSettings(
  agencyId: string,
  userId: string,
  updates: Partial<Omit<NotificationSettingsType, 'id' | 'agencyId' | 'userId'>>
): Promise<{ success: boolean; settings?: NotificationSettingsType; error?: string }> {
  if (!db) return { success: false, error: 'Database not connected' };

  try {
    // Check if settings exist
    const existing = await getNotificationSettings(agencyId, userId);

    if (existing) {
      // Update existing settings
      const updated = await db
        .update(notificationSettings)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(notificationSettings.id, existing.id))
        .returning()
        .then((r: any[]) => r[0]);

      return {
        success: true,
        settings: {
          id: updated.id,
          agencyId: updated.agencyId,
          userId: updated.userId,
          emailNotifications: updated.emailNotifications,
          email90Day: updated.email90Day,
          email60Day: updated.email60Day,
          email30Day: updated.email30Day,
          pushNotifications: updated.pushNotifications,
          pushEnabled: updated.pushEnabled,
          pushSubscription: updated.pushSubscription,
          weeklyReports: updated.weeklyReports,
          weeklyReportDay: updated.weeklyReportDay,
          autoRenewalAlerts: updated.autoRenewalAlerts,
          autoRenewalDays: updated.autoRenewalDays,
          commissionAlerts: updated.commissionAlerts,
        },
      };
    } else {
      // Create new settings
      const created = await db
        .insert(notificationSettings)
        .values({
          agencyId,
          userId,
          ...DEFAULT_SETTINGS,
          ...updates,
        } as any)
        .returning()
        .then((r: any[]) => r[0]);

      return {
        success: true,
        settings: {
          id: created.id,
          agencyId: created.agencyId,
          userId: created.userId,
          emailNotifications: created.emailNotifications,
          email90Day: created.email90Day,
          email60Day: created.email60Day,
          email30Day: created.email30Day,
          pushNotifications: created.pushNotifications,
          pushEnabled: created.pushEnabled,
          pushSubscription: created.pushSubscription,
          weeklyReports: created.weeklyReports,
          weeklyReportDay: created.weeklyReportDay,
          autoRenewalAlerts: created.autoRenewalAlerts,
          autoRenewalDays: created.autoRenewalDays,
          commissionAlerts: created.commissionAlerts,
        },
      };
    }
  } catch (error) {
    console.error('Error upserting notification settings:', error);
    return { success: false, error: 'Failed to save settings' };
  }
}

/**
 * Check if a specific notification type is enabled
 */
export function isNotificationEnabled(
  settings: NotificationSettingsType | null,
  key: keyof Pick<NotificationSettingsType, 'emailNotifications' | 'email90Day' | 'email60Day' | 'email30Day' | 'pushNotifications' | 'weeklyReports' | 'autoRenewalAlerts' | 'commissionAlerts'>
): boolean {
  if (!settings) return (DEFAULT_SETTINGS as any)[key] ?? true;
  return (settings as any)[key] ?? (DEFAULT_SETTINGS as any)[key] ?? true;
}

/**
 * Check if email notifications are enabled for a specific day threshold
 */
export function isEmailNotificationEnabled(
  settings: NotificationSettingsType | null,
  daysOut: number
): boolean {
  if (!settings) return true;

  // First check if email notifications are globally enabled
  if (!settings.emailNotifications) return false;

  // Check specific day thresholds
  if (daysOut <= 30) return settings.email30Day;
  if (daysOut <= 60) return settings.email60Day;
  if (daysOut <= 90) return settings.email90Day;

  return true;
}
