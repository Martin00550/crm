import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { getUserAgencyId } from '@/actions/data';
import { getNotificationSettings, upsertNotificationSettings } from '@/lib/notification-settings';
import { logger } from '@/lib/logger';

// GET /api/notification-settings - Get user's notification settings
export async function GET() {
  try {
    const { userId } = await getAuth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agencyId = await getUserAgencyId(userId);
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    const settings = await getNotificationSettings(agencyId, userId);

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    logger.error('Error fetching notification settings', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notification-settings - Update user's notification settings
import { withApiSecurity } from '@/lib/api-security';

// POST /api/notification-settings - Update user's notification settings
export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    try {
      const { agencyId, userId } = context;
      
      if (!userId || !agencyId) {
        return NextResponse.json({ error: 'Unauthorized or Agency not found' }, { status: 401 });
      }

      const body = await request.json();
      
      // Validate the updates
      const allowedFields = [
        'emailNotifications',
        'email90Day',
        'email60Day',
        'email30Day',
        'pushNotifications',
        'pushEnabled',
        'pushSubscription',
        'weeklyReports',
        'weeklyReportDay',
        'autoRenewalAlerts',
        'autoRenewalDays',
      ];

      const updates: Record<string, any> = {};
      for (const key of allowedFields) {
        if (key in body) {
          updates[key] = body[key];
        }
      }

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
      }

      const result = await upsertNotificationSettings(agencyId, userId, updates);

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        settings: result.settings,
      });
    } catch (error) {
      logger.error('Error updating notification settings', error);
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
