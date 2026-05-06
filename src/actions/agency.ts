'use server';

import { db } from '@/lib/db';
import { users, agencies, policies } from '@/db/schema';
import { eq, and, sql, type InferSelectModel } from 'drizzle-orm';
import { requireAuth, requireAgencyAuth } from '@/lib/auth-wrapper';
import { Errors } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { getOrSetCached, CacheKeys, CacheConfig } from '@/lib/redis';
import { revalidatePath } from 'next/cache';
import { notificationSettings } from '@/db/schema';

export async function getUserAgencyId(userId: string): Promise<string | null> {
  if (process.env.MOCK_AUTH === 'true' && userId === (process.env.MOCK_USER_ID || 'mock-user-id')) {
    return process.env.MOCK_AGENCY_ID || 'mock-agency-id';
  }

  if (!db) return null;

  const [user] = await db
    .select({ agencyId: users.agencyId })
    .from(users)
    .where(eq(users.workosUserId, userId))
    .limit(1);

  return user?.agencyId || null;
}

import { getDashboardStatsQuery } from '@/server/queries';

export async function getDashboardStats(agencyId: string, range?: string) {
  const authResult = await requireAgencyAuth();
  if (authResult.agencyId !== agencyId) {
    throw Errors.authorization('Forbidden: You do not have access to this agency');
  }
  
  return getDashboardStatsQuery(agencyId, range);
}

export async function getAgency(agencyId: string) {
  const authResult = await requireAgencyAuth();
  if (authResult.agencyId !== agencyId) {
    throw Errors.authorization('Forbidden: You do not have access to this agency');
  }
  
  if (!db) {
    throw Errors.server('Database connection failed');
  }

  const [agency] = await db
    .select()
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .limit(1);

  if (agency?.branding?.logoUrl && !agency.branding.logoUrl.startsWith('http')) {
    const { getPresignedUrl } = await import('@/lib/storage');
    try {
      agency.branding.logoUrl = await getPresignedUrl(agency.branding.logoUrl);
    } catch (err) {
      console.error('Failed to sign logo URL:', err);
    }
  }

  return agency;
}

export async function createAgency(data: {
  name: string;
  subdomain?: string;
  userId: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  tier?: string;
}) {
  try {
    const authResult = await requireAuth();
    
    if (data.userId !== authResult.userId) {
      return { success: false, error: 'Forbidden: Cannot create agency for another user' };
    }
    
    if (!db) {
      return { success: false, error: 'Database connection failed' };
    }

    const { name, subdomain, userId, email, firstName, lastName, tier } = data;

    const defaultSubdomain = subdomain || name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30) + '-' + Math.random().toString(36).substring(2, 8);

    const selectedTier = tier && ['solo', 'growth', 'enterprise'].includes(tier) ? tier : 'solo';

    const [newAgency] = await db
      .insert(agencies)
      .values({
        name,
        subdomain: defaultSubdomain.toLowerCase(),
        subscriptionTier: selectedTier,
        subscriptionStatus: 'trialing',
        trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
      })
      .returning();

    if (!newAgency) {
      throw new Error('Failed to create agency record');
    }

    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.workosUserId, userId))
      .limit(1);

    if (existingUser) {
      await db
        .update(users)
        .set({ agencyId: newAgency.id })
        .where(eq(users.id, existingUser.id));
    } else {
      await db
        .insert(users)
        .values({
          workosUserId: userId,
          email: email || '',
          name: `${firstName || ''} ${lastName || ''}`.trim() || null,
          agencyId: newAgency.id,
          role: 'owner',
        });
    }

    revalidatePath('/dashboard');
    return { success: true, agency: newAgency };
  } catch (error) {
    logger.error('Error in createAgency action:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create agency' 
    };
  }
}

export async function getNotificationSettings(agencyId: string) {
  const authResult = await requireAgencyAuth();
  if (authResult.agencyId !== agencyId) {
    throw Errors.authorization('Forbidden: You do not have access to this agency');
  }

  if (!db) throw Errors.server('Database connection failed');

  const [settings] = await db
    .select()
    .from(notificationSettings)
    .where(eq(notificationSettings.agencyId, agencyId))
    .limit(1);

  if (!settings) {
    // Create default settings if not exists
    const [newSettings] = await db
      .insert(notificationSettings)
      .values({
        agencyId,
        emailNotifications: true,
        email90Day: true,
        email60Day: true,
        email30Day: true,
        pushNotifications: false,
        autoRenewalAlerts: true,
      })
      .returning();
    return newSettings;
  }

  return settings;
}

export async function updateNotificationSettings(
  agencyId: string,
  data: Partial<InferSelectModel<typeof notificationSettings>>
) {
  const authResult = await requireAgencyAuth();
  if (authResult.agencyId !== agencyId) {
    throw Errors.authorization('Forbidden: You do not have access to this agency');
  }

  if (!db) throw Errors.server('Database connection failed');

  const { id, agencyId: aId, createdAt, updatedAt, ...updateData } = data;

  await db
    .update(notificationSettings)
    .set({
      ...updateData,
      updatedAt: new Date(),
    })
    .where(eq(notificationSettings.agencyId, agencyId));

  revalidatePath('/dashboard');
  return { success: true };
}
