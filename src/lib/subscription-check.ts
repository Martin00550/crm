import { db } from '@/lib/db';
import { agencies } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface SubscriptionCheck {
  hasActiveSubscription: boolean | null;
  subscriptionStatus: string | null;
  subscriptionTier: string | null;
  trialEnd: Date | null;
  isTrialExpired: boolean;
  isReadOnly: boolean;
  canAccessDashboard: boolean | null;
  reason?: string;
}

/**
 * Check if agency has active subscription
 * Returns detailed subscription status
 */
export async function checkAgencySubscription(agencyId: string): Promise<SubscriptionCheck> {
  if (!db) {
    return {
      hasActiveSubscription: false,
      subscriptionStatus: null,
      subscriptionTier: null,
      trialEnd: null,
      isTrialExpired: false,
      isReadOnly: false,
      canAccessDashboard: false,
      reason: 'Database not connected',
    };
  }

  const agency = await db
    .select({
      subscriptionStatus: agencies.subscriptionStatus,
      subscriptionTier: agencies.subscriptionTier,
      trialEnd: agencies.trialEnd,
    })
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .limit(1)
    .then((r: any[]) => r[0]);

  if (!agency) {
    return {
      hasActiveSubscription: false,
      subscriptionStatus: null,
      subscriptionTier: null,
      trialEnd: null,
      isTrialExpired: false,
      isReadOnly: false,
      canAccessDashboard: false,
      reason: 'Agency not found',
    };
  }

  const now = new Date();
  const trialEndDate = agency.trialEnd ? new Date(agency.trialEnd) : null;
  const isTrialExpired = trialEndDate ? trialEndDate < now : false;

  // Allow access if:
  // 1. Subscription is active
  // 2. Subscription is trialing (even if expired, it becomes read-only)
  const hasActiveSubscription = agency.subscriptionStatus === 'active';
  const isTrialing = agency.subscriptionStatus === 'trialing';
  
  // Soft lock if trialing AND expired
  const isReadOnly = isTrialing && isTrialExpired;
  
  // Users can always access dashboard if they are active OR trialing (soft lock handled via flag)
  const canAccessDashboard = hasActiveSubscription || isTrialing;

  return {
    hasActiveSubscription,
    subscriptionStatus: agency.subscriptionStatus,
    subscriptionTier: agency.subscriptionTier,
    trialEnd: trialEndDate,
    isTrialExpired,
    isReadOnly,
    canAccessDashboard,
    reason: canAccessDashboard 
      ? undefined 
      : agency.subscriptionStatus === 'past_due'
        ? 'Subscription payment is past due'
        : agency.subscriptionStatus === 'canceled'
          ? 'Subscription has been canceled'
          : 'No active subscription',
  };
}

/**
 * Require active subscription - throws if not subscribed
 * Use in server actions and pages that require paid access
 */
export async function requireActiveSubscription(agencyId: string): Promise<void> {
  const check = await checkAgencySubscription(agencyId);
  
  if (!check.canAccessDashboard) {
    throw new Error(check.reason || 'Active subscription required');
  }
}
