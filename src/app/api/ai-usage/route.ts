import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { getFeatureUsage } from '@/lib/feature-access';
import { getFeatureLimit } from '@/lib/features';
import { getUserAgencyId, getAgency } from '@/actions/data';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agencyId = request.nextUrl.searchParams.get('agencyId');
    
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    // Verify user belongs to agency
    const userAgencyId = await getUserAgencyId(userId);
    if (userAgencyId !== agencyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get agency tier
    const agency = await getAgency(agencyId);
    const tier = agency?.subscriptionTier || 'solo';

    // Get current usage
    const currentUsage = await getFeatureUsage(agencyId, 'aiRateForensics');
    
    // Get limit for tier
    const limit = getFeatureLimit('aiRateForensics', tier as any);

    return NextResponse.json({ 
      current: currentUsage, 
      limit: limit === Infinity ? null : limit 
    });
  } catch (error) {
    console.error('Error fetching AI usage:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
