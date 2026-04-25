import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { agencies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getAdvancedAnalytics } from '@/lib/advanced-analytics';
import { isFeatureEnabled, SubscriptionTier } from '@/lib/features';
import { getUserAgencyId } from '@/actions/data';

// GET /api/analytics/advanced - Get advanced analytics data
export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agencyId = await getUserAgencyId(userId);
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Get agency's tier
    const agency = await db
      .select({ subscriptionTier: agencies.subscriptionTier })
      .from(agencies)
      .where(eq(agencies.id, agencyId))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Check if advanced analytics is enabled for this tier
    if (!isFeatureEnabled('advancedAnalytics', agency.subscriptionTier as SubscriptionTier)) {
      return NextResponse.json({ 
        error: 'Advanced Analytics not available in your plan',
        upgradeMessage: 'Upgrade to Growth plan to access Advanced Analytics'
      }, { status: 403 });
    }

    // Get advanced analytics data
    const analyticsData = await getAdvancedAnalytics(agencyId);

    return NextResponse.json({
      success: true,
      data: analyticsData,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching advanced analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
