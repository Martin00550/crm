'use server';

import { db } from '@/lib/db';
import { featureUsage, agencies } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { 
  isFeatureEnabled, 
  getFeatureLimit, 
  isWithinLimit,
  getUpgradeMessage,
  type SubscriptionTier 
} from '@/lib/features';

// Get current billing period (month)
function getCurrentBillingPeriod() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

// Get or create usage record for a feature
export async function getFeatureUsage(
  agencyId: string,
  featureKey: string
): Promise<number> {
  if (!db) return 0;

  const { start, end } = getCurrentBillingPeriod();

  const usage = await db
    .select()
    .from(featureUsage)
    .where(
      and(
        eq(featureUsage.agencyId, agencyId),
        eq(featureUsage.featureKey, featureKey)
      )
    )
    .limit(1)
    .then((r: typeof featureUsage.$inferSelect[]) => r[0]);

  if (!usage) {
    // Create new usage record
    await db.insert(featureUsage).values({
      agencyId,
      featureKey,
      usageCount: 0,
      billingPeriodStart: start,
      billingPeriodEnd: end,
    });
    return 0;
  }

  // Check if we need to reset for new billing period (using UTC for consistency)
  const now = new Date();
  if (now > usage.billingPeriodEnd) {
    await db
      .update(featureUsage)
      .set({
        usageCount: 0,
        billingPeriodStart: start,
        billingPeriodEnd: end,
        updatedAt: now,
      })
      .where(eq(featureUsage.id, usage.id));
    return 0;
  }

  return usage.usageCount;
}

// Increment usage count for a feature
// Uses atomic increment to prevent race conditions
export async function incrementFeatureUsage(
  agencyId: string,
  featureKey: string
): Promise<void> {
  if (!db) return;

  const { start, end } = getCurrentBillingPeriod();

  // Use atomic increment to prevent race conditions
  // First try to increment existing record
  const result = await db.execute(sql`
    UPDATE feature_usage 
    SET usage_count = usage_count + 1, 
        updated_at = NOW()
    WHERE agency_id = ${agencyId} 
      AND feature_key = ${featureKey}
      AND billing_period_start >= ${start}
      AND billing_period_end <= ${end}
    RETURNING usage_count
  `);

  // If no record exists or expired, create new one
  if ((result.rows as any[]).length === 0) {
    await db.insert(featureUsage)
      .values({
        agencyId,
        featureKey,
        usageCount: 1,
        billingPeriodStart: start,
        billingPeriodEnd: end,
      })
      .onConflictDoUpdate({
        target: [featureUsage.agencyId, featureUsage.featureKey],
        set: {
          usageCount: 1,
          billingPeriodStart: start,
          billingPeriodEnd: end,
          updatedAt: new Date(),
        },
      });
  }
}

// Check if agency can use a feature
export async function canUseFeature(
  agencyId: string,
  featureKey: string
): Promise<{ allowed: boolean; reason?: string; currentUsage?: number; limit?: number }> {
  if (!db) {
    return { allowed: false, reason: 'Database not connected' };
  }

  // Get agency tier
  const agency = await db
    .select()
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!agency) {
    return { allowed: false, reason: 'Agency not found' };
  }

  const tier = agency.subscriptionTier as SubscriptionTier;

  // Check if feature is enabled for tier
  if (!isFeatureEnabled(featureKey, tier)) {
    return {
      allowed: false,
      reason: getUpgradeMessage(featureKey, tier),
    };
  }

  // Get limit for feature
  const limit = getFeatureLimit(featureKey, tier);

  // If no limit or unlimited, allow
  if (limit === null || limit === Infinity) {
    return { allowed: true };
  }

  // Check current usage
  const currentUsage = await getFeatureUsage(agencyId, featureKey);

  if (!isWithinLimit(featureKey, tier, currentUsage)) {
    return {
      allowed: false,
      reason: `You've used ${currentUsage}/${limit} ${featureKey} this month. ${getUpgradeMessage(featureKey, tier)}`,
      currentUsage,
      limit,
    };
  }

  return {
    allowed: true,
    currentUsage,
    limit,
  };
}

// Check feature access without usage tracking (for display purposes)
export async function checkFeatureAccess(
  tier: SubscriptionTier,
  featureKey: string
): Promise<{ enabled: boolean; limit?: number }> {
  const enabled = isFeatureEnabled(featureKey, tier);
  const limit = getFeatureLimit(featureKey, tier);

  return { enabled, limit: limit ?? undefined };
}

// Get all features for a tier (for settings/display)
export async function getTierFeatures(tier: SubscriptionTier): Promise<Record<string, { enabled: boolean; limit?: number | string }>> {
  const features: Record<string, { enabled: boolean; limit?: number | string }> = {};

  for (const key of Object.keys(require('@/lib/features').FEATURES)) {
    const access = await checkFeatureAccess(tier, key);
    features[key] = access;
  }

  return features;
}
