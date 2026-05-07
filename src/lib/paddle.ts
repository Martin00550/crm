import { db } from '@/lib/db';
import { agencies, users } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { createAgency } from '@/actions/data';
import { handlePaddleBillingEvent } from '@/lib/billing';
import { revalidatePath } from 'next/cache';

// Paddle API configuration
const PADDLE_API_KEY = process.env.PADDLE_API_KEY || '';
const PADDLE_ENVIRONMENT = process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
const PADDLE_BASE_URL = PADDLE_ENVIRONMENT === 'production' 
  ? 'https://api.paddle.com' 
  : 'https://sandbox-api.paddle.com';

import { PADDLE_PRICE_IDS, SUBSCRIPTION_TIERS } from './paddle-shared';

// Helper function to make Paddle API calls
async function paddleAPI(endpoint: string, method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET', data?: any) {
  const url = `${PADDLE_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${PADDLE_API_KEY}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error('Paddle API error', error);
    throw new Error(`Paddle API error: ${response.status} ${error}`);
  }

  return response.json();
}

/**
 * Create or update agency record with Paddle customer ID
 */
export async function createCustomer(agencyId: string, email: string, name: string) {
  if (!db) return { id: '', email, name };
  // In Paddle, customers are created automatically during checkout
  await db
    .update(agencies)
    .set({ 
      paddleCustomerId: '', // Paddle customer ID (set during checkout)
      paddleSubscriptionId: '', // Paddle subscription ID (set during checkout)
    })
    .where(eq(agencies.id, agencyId));

  return { id: '', email, name };
}

/**
 * Create a subscription via Paddle checkout
 * Returns checkout URL for Paddle popup
 * Includes 14-day trial with payment method required
 */
export async function createSubscription(
  agencyId: string,
  customerId: string,
  tier: 'solo' | 'growth' | 'enterprise',
  userId?: string
) {
  const priceId = SUBSCRIPTION_TIERS[tier].priceId;

  try {
    // Create a payment link (checkout) in Paddle with 14-day trial
    const checkout = await paddleAPI('/checkouts', 'POST', {
      items: [
        {
          price_id: priceId,
          quantity: 1,
        },
      ],
      customer: {
        id: customerId || undefined,
      },
      custom_data: {
        agencyId,
        userId: userId || '', // Pass userId for agency creation in webhook
        tier,
      },
      settings: {
        enable_recurring: true,
        payment_method_required: true, // Require payment method for trial
      },
      billing_details: {
        payment_terms: {
          trial_period_days: 0, // No trial in Paddle, we manage it in our DB
        },
      },
    });

    return {
      checkoutUrl: checkout.data?.url || checkout.url,
      checkoutId: checkout.data?.id || checkout.id,
    };
  } catch (error) {
    logger.error('Failed to create Paddle checkout', error);
    throw error;
  }
}

/**
 * Update an existing subscription (upgrade/downgrade)
 * Changes the price ID to a different tier
 */
export async function updateSubscription(
  agencyId: string,
  newTier: 'solo' | 'growth' | 'enterprise'
) {
  if (!db) return { success: false, error: 'Database not connected' };
  const agency = await db
    .select()
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .then((a: any[]) => a[0]);

  if (!agency?.paddleSubscriptionId) {
    return { success: false, error: 'No active subscription found' };
  }

  const priceId = SUBSCRIPTION_TIERS[newTier].priceId;

  try {
    // Update subscription items in Paddle
    await paddleAPI(`/subscriptions/${agency.paddleSubscriptionId}/items`, 'PATCH', {
      items: [
        {
          price_id: priceId,
          quantity: 1,
        },
      ],
    });

    // Update tier in database
    await db
      .update(agencies)
      .set({ subscriptionTier: newTier })
      .where(eq(agencies.id, agencyId));

    return { success: true };
  } catch (error) {
    logger.error('Failed to update subscription', error);
    return { success: false, error: 'Failed to update subscription' };
  }
}

/**
 * Cancel a subscription via Paddle
 */
export async function cancelSubscription(agencyId: string) {
  if (!db) return { success: false, error: 'Database not connected' };
  const agency = await db
    .select()
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .then((a: any[]) => a[0]);

  if (!agency?.paddleSubscriptionId) {
    return { success: false, error: 'No subscription found' };
  }

  try {
    // Cancel subscription in Paddle
    await paddleAPI(`/subscriptions/${agency.paddleSubscriptionId}`, 'POST', {
      action: 'cancel',
      effective_from: 'immediately',
    });

    await db
      .update(agencies)
      .set({ subscriptionStatus: 'cancelled' })
      .where(eq(agencies.id, agencyId));

    return { success: true };
  } catch (error) {
    logger.error('Failed to cancel subscription', error);
    return { success: false, error: 'Failed to cancel subscription' };
  }
}

/**
 * Get a secure management URL for the subscription
 * Use this for "Update Credit Card" or "Manage Subscription" buttons
 */
export async function getSubscriptionManagementUrl(agencyId: string) {
  if (!db) return null;
  const agency = await db
    .select()
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .then((a: any[]) => a[0]);

  if (!agency?.paddleSubscriptionId) return null;

  try {
    const response = await paddleAPI(`/subscriptions/${agency.paddleSubscriptionId}/activate`, 'GET');
    // Note: In Paddle Billing v2, management URLs are often provided in the subscription resource
    // or can be generated via the transactions/adjustments API
    return response.data?.management_urls?.update_payment_method || null;
  } catch (error) {
    logger.error('Failed to get management URL', error);
    return null;
  }
}

/**
 * Get subscription status from Paddle
 */
export async function getSubscriptionStatus(agencyId: string) {
  if (!db) return { status: 'none', tier: null };
  const agency = await db
    .select()
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .then((a: any[]) => a[0]);

  if (!agency?.paddleSubscriptionId) {
    return { status: 'none', tier: null };
  }

  try {
    const subscription = await paddleAPI(`/subscriptions/${agency.paddleSubscriptionId}`);

    return {
      status: subscription.data?.status || 'active',
      tier: agency.subscriptionTier,
      currentPeriodEnd: subscription.data?.current_billing_period?.ends_at,
    };
  } catch (error) {
    logger.error('Failed to get subscription status', error);
    return { status: 'error', tier: agency.subscriptionTier };
  }
}

/**
 * Handle Paddle webhook events
 */
export async function handleWebhook(event: any) {
  if (!db) return { received: false, error: 'Database not connected' };
  const eventType = event.event_type;

  switch (eventType) {
    case 'subscription.created': {
      const subscription = event.data;
      const agencyId = subscription.custom_data?.agencyId;
      const customerId = subscription.customer_id;
      const userId = subscription.custom_data?.userId;
      const tierFromCustomData = subscription.custom_data?.tier;

      if (agencyId) {
        // Existing agency - update it
        const tier = tierFromCustomData || Object.entries(PADDLE_PRICE_IDS).find(
          ([_, priceId]) => subscription.items?.[0]?.price_id === priceId
        )?.[0] as 'solo' | 'growth' | 'enterprise' | undefined;

        if (tier) {
          // Calculate trial end date from subscription
          const trialEnd = subscription.current_billing_period?.ends_at 
            ? new Date(subscription.current_billing_period.ends_at)
            : null;

          await db
            .update(agencies)
            .set({
              paddleCustomerId: customerId || '',
              paddleSubscriptionId: subscription.id,
              subscriptionTier: tier,
              subscriptionStatus: subscription.status === 'trialing' ? 'trialing' : 'active',
              trialEnd: subscription.status === 'active' ? null : trialEnd,
              currency: subscription.currency_code || 'USD',
            })
            .where(eq(agencies.id, agencyId));
        }
      } else if (userId) {
        // New user - create agency
        const tier = tierFromCustomData || Object.entries(PADDLE_PRICE_IDS).find(
          ([_, priceId]) => subscription.items?.[0]?.price_id === priceId
        )?.[0] as 'solo' | 'growth' | 'enterprise' | undefined;

        if (tier) {
          // Calculate trial end date from subscription
          const trialEnd = subscription.current_billing_period?.ends_at 
            ? new Date(subscription.current_billing_period.ends_at)
            : null;

          try {
            await createAgency({
              name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Agency`,
              subdomain: '',
              userId,
              tier,
            });

            // Get the newly created agency
            const user = await db
              .select({ agencyId: users.agencyId })
              .from(users)
              .where(eq(users.id, userId))
              .limit(1)
              .then((r: any[]) => r[0]);

            if (user?.agencyId) {
              await db
                .update(agencies)
                .set({
                  paddleCustomerId: customerId || '',
                  paddleSubscriptionId: subscription.id,
                  subscriptionTier: tier,
                  subscriptionStatus: subscription.status === 'trialing' ? 'trialing' : 'active',
                  trialEnd: subscription.status === 'active' ? null : trialEnd,
                })
                .where(eq(agencies.id, user.agencyId));
            }
          } catch (error) {
            logger.error('Failed to create agency for user', error);
          }
        }
      }
      break;
    }

    case 'subscription.updated': {
      const subscription = event.data;
      const agencyId = subscription.custom_data?.agencyId;

      if (agencyId) {
        // Update tier if price changed (upgrade/downgrade)
        const tier = Object.entries(PADDLE_PRICE_IDS).find(
          ([_, priceId]) => subscription.items?.[0]?.price_id === priceId
        )?.[0] as 'solo' | 'growth' | 'enterprise' | undefined;

        const updateData: any = {
          subscriptionStatus: subscription.status === 'active' ? 'active' : 
                            subscription.status === 'trialing' ? 'trialing' : 
                            subscription.status === 'past_due' ? 'past_due' : 
                            subscription.status === 'paused' ? 'paused' : subscription.status,
          currency: subscription.currency_code || 'USD',
        };

        if (subscription.status === 'active') {
          updateData.trialEnd = null;
        }

        if (tier) {
          updateData.subscriptionTier = tier;
        }

        await db
          .update(agencies)
          .set(updateData)
          .where(eq(agencies.id, agencyId));
      }
      break;
    }

    case 'subscription.canceled': {
      const subscription = event.data;
      const agencyId = subscription.custom_data?.agencyId;

      if (agencyId) {
        await db
          .update(agencies)
          .set({ 
            subscriptionStatus: 'cancelled',
            subscriptionTier: 'solo', // Revert to solo
          })
          .where(eq(agencies.id, agencyId));
      }
      break;
    }

    case 'subscription.activated': {
      // Trial converted to paid subscription
      const subscription = event.data;
      const agencyId = subscription.custom_data?.agencyId;

      if (agencyId) {
        await db
          .update(agencies)
          .set({ 
            subscriptionStatus: 'active',
            trialEnd: null, // Trial ended
          })
          .where(eq(agencies.id, agencyId));
      }
      break;
    }

    case 'subscription.trial_ending': {
      // Trial is about to end - send reminder
      const subscription = event.data;
      const agencyId = subscription.custom_data?.agencyId;

      if (agencyId) {
        // Could trigger email notification here
        logger.info('Trial ending for agency', { agencyId, subscriptionId: subscription.id });
      }
      break;
    }

    case 'transaction.payment_failed': {
      const transaction = event.data;
      const subscriptionId = transaction.subscription_id;

      if (subscriptionId) {
        // Find agency by subscription ID
        const agency = await db
          .select()
          .from(agencies)
          .where(eq(agencies.paddleSubscriptionId, subscriptionId))
          .then((a: any[]) => a[0]);

        if (agency) {
          await db
            .update(agencies)
            .set({ subscriptionStatus: 'past_due' })
            .where(eq(agencies.id, agency.id));
        }
      }
      break;
    }

    case 'transaction.paid': {
      const transaction = event.data;
      const subscriptionId = transaction.subscription_id;

      if (subscriptionId) {
        // Find agency by subscription ID
        const agency = await db
          .select()
          .from(agencies)
          .where(eq(agencies.paddleSubscriptionId, subscriptionId))
          .then((a: any[]) => a[0]);

        if (agency) {
          await db
            .update(agencies)
            .set({ 
              subscriptionStatus: 'active',
              trialEnd: null,
            })
            .where(eq(agencies.id, agency.id));
        }
      }
      break;
    }

    default:
      logger.warn('Unhandled Paddle event type', { eventType });
  }

  // Also handle billing events (invoices, payments)
  await handlePaddleBillingEvent(event);

  // Clear caches for relevant paths
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings/billing');

  return { received: true };
}

/**
 * Add a producer seat to the agency's Paddle subscription
 * Note: Enterprise includes unlimited producers for free, so this is only used for tracking
 */
export async function addProducerSeat(
  agencyId: string,
  customerId: string
): Promise<{ success: boolean; error?: string }> {
  // Enterprise includes unlimited producers for free - no additional charge needed
  return { success: true };
}

/**
 * Remove a producer seat from the agency's Paddle subscription
 * Note: Enterprise includes unlimited producers for free, so this is only used for tracking
 */
export async function removeProducerSeat(
  agencyId: string,
  customerId: string,
  subscriptionItemId: string
): Promise<{ success: boolean; error?: string }> {
  // Enterprise includes unlimited producers for free - no removal needed
  return { success: true };
}

/**
 * Get the current producer seat count for an agency
 */
export async function getProducerSeatCount(
  agencyId: string
): Promise<number> {
  if (!db) return 0;

  const result = await db
    .select({ count: count() })
    .from(users)
    .where(
      and(
        eq(users.agencyId, agencyId),
        eq(users.role, 'producer')
      )
    );

  return result[0]?.count || 0;
}
