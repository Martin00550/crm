import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { agencies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSubscription, cancelSubscription, getSubscriptionStatus, updateSubscription } from '@/lib/paddle';
import { withApiSecurity } from '@/lib/api-security';

// GET /api/subscription - Get current subscription status
export const GET = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId } = context;

    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const status = await getSubscriptionStatus(agencyId);
    return NextResponse.json(status);
  },
  {
    requireAuth: true,
    requireAgency: true,
    rateLimit: 'api',
    auditAction: 'subscription.view',
  }
);

// POST /api/subscription - Create new subscription checkout
export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    const { userId, agencyId } = context;

    const body = await request.json();
    const { tier, customerId, userId: providedUserId } = body;

    if (!tier || !['solo', 'growth', 'enterprise'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // If no agency exists, this is a new user - use provided userId from client
    // Agency will be created by webhook after successful payment
    const targetAgencyId = agencyId || '';
    const targetUserId = providedUserId || userId!;

    // Create Paddle checkout
    const result = await createSubscription(targetAgencyId, customerId, tier, targetUserId);

    return NextResponse.json({
      checkoutUrl: result.checkoutUrl,
      checkoutId: result.checkoutId,
    });
  },
  {
    requireAuth: true,
    enableCsrf: true,
    rateLimit: 'api',
    auditAction: 'subscription.create',
  }
);

// PATCH /api/subscription - Update existing subscription (upgrade/downgrade)
export const PATCH = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId } = context;

    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { tier } = body;

    if (!tier || !['solo', 'growth', 'enterprise'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    // Update subscription tier
    const result = await updateSubscription(agencyId, tier);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
    auditAction: 'subscription.update',
  }
);

// DELETE /api/subscription - Cancel subscription
export const DELETE = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId } = context;

    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const result = await cancelSubscription(agencyId);
    return NextResponse.json(result);
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
    auditAction: 'subscription.cancel',
  }
);

