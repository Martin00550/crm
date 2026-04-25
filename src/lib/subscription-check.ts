import { db } from '@/lib/db';
import { agencies } from '@/db/schema';
import { eq } from 'drizzle-orm';

export interface SubscriptionCheck {
  hasActiveSubscription: boolean | null;
  subscriptionStatus: string | null;
  subscriptionTier: string | null;
  trialEnd: Date | null;
  isTrialExpired: boolean;
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
      canAccessDashboard: false,
      reason: 'Agency not found',
    };
  }

  const now = new Date();
  const trialEndDate = agency.trialEnd ? new Date(agency.trialEnd) : null;
  const isTrialExpired = trialEndDate ? trialEndDate < now : true; // If trialEnd is null, consider as expired (no payment yet)

  // Allow access if subscription is active OR in valid trial
  const hasActiveSubscription = 
    agency.subscriptionStatus === 'active' || 
    (agency.subscriptionStatus === 'trialing' && trialEndDate && trialEndDate > now);

  const canAccessDashboard = hasActiveSubscription;

  return {
    hasActiveSubscription,
    subscriptionStatus: agency.subscriptionStatus,
    subscriptionTier: agency.subscriptionTier,
    trialEnd: trialEndDate,
    isTrialExpired,
    canAccessDashboard,
    reason: canAccessDashboard 
      ? undefined 
      : !trialEndDate
        ? 'Payment required to start trial'
        : isTrialExpired 
          ? 'Trial period has expired' 
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
