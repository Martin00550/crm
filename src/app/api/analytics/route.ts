import { NextRequest, NextResponse } from 'next/server';
import { withApiSecurity } from '@/lib/api-security';
import { getAgencyAnalytics } from '@/lib/analytics';
import { getOrSetCached, CacheKeys, CacheConfig } from '@/lib/redis';

export const GET = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId } = context;
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    // Use Redis caching for analytics (5 minute cache)
    const cacheKey = CacheKeys.dashboardStats(agencyId);
    const analytics = await getOrSetCached(cacheKey, CacheConfig.DASHBOARD_STATS, async () => {
      return getAgencyAnalytics(agencyId);
    });

    return NextResponse.json(analytics);
  },
  {
    requireAuth: true,
    requireAgency: true,
    rateLimit: 'api',
    auditAction: 'analytics.view',
  }
);
