import { NextRequest, NextResponse } from 'next/server';
import { withApiSecurity } from '@/lib/api-security';
import { predictPolicyLeakage, getLeakagePredictionSummary, getLeakagePreventionRecommendations } from '@/lib/predictive-analytics';
import { getOrSetCached, CacheKeys, CacheConfig } from '@/lib/redis';

export const GET = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId } = context;
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'policies';

    if (type === 'policies') {
      const predictions = await predictPolicyLeakage(agencyId);
      return NextResponse.json(predictions);
    }

    if (type === 'summary') {
      const summary = await getLeakagePredictionSummary(agencyId);
      return NextResponse.json(summary);
    }

    if (type === 'recommendations') {
      // Cache recommendations for 1 hour
      const cacheKey = `recommendations:${agencyId}`;
      const recommendations = await getOrSetCached(cacheKey, 3600, async () => {
        return getLeakagePreventionRecommendations(agencyId);
      });
      return NextResponse.json(recommendations);
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  },
  {
    requireAuth: true,
    requireAgency: true,
    rateLimit: 'api',
    auditAction: 'analytics.predictions',
  }
);
