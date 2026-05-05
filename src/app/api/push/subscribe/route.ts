import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { getUserAgencyId } from '@/actions/data';
import { upsertNotificationSettings } from '@/lib/notification-settings';
import { logger } from '@/lib/logger';

import { withApiSecurity } from '@/lib/api-security';

// POST /api/push/subscribe - Subscribe to push notifications
export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    try {
      const { agencyId, userId } = context;
      if (!userId || !agencyId) { return NextResponse.json({ error: "Unauthorized or Agency not found" }, { status: 401 }); }

      if (!agencyId) {
        return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
      }

      const subscription = await request.json();

      if (!subscription?.endpoint) {
        return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
      }

      const result = await upsertNotificationSettings(agencyId, userId, {
        pushNotifications: true,
        pushEnabled: true,
        pushSubscription: subscription,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Push subscription saved',
      });
    } catch (error) {
      logger.error('Push subscribe error', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
  }
);

// DELETE /api/push/subscribe - Unsubscribe from push notifications
export const DELETE = withApiSecurity(
  async (request: NextRequest, context) => {
    try {
      const { agencyId, userId } = context;
      if (!userId || !agencyId) { return NextResponse.json({ error: "Unauthorized or Agency not found" }, { status: 401 }); }

      if (!agencyId) {
        return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
      }

      const result = await upsertNotificationSettings(agencyId, userId, {
        pushEnabled: false,
        pushSubscription: null,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Push subscription removed',
      });
    } catch (error) {
      logger.error('Push unsubscribe error', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
  }
);

// GET /api/push/subscribe - Get VAPID public key
export async function GET() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    return NextResponse.json({ error: 'Push notifications not configured' }, { status: 503 });
  }

  return NextResponse.json({
    success: true,
    vapidPublicKey,
  });
}
