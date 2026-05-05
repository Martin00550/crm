import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { agencies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { calculatePolicyRisk, getAgencyRiskSummary } from '@/lib/risk-scoring';
import { isFeatureEnabled, SubscriptionTier } from '@/lib/features';
import { getUserAgencyId } from '@/actions/data';
import { logger } from '@/lib/logger';

// GET /api/risk/dashboard - Get risk dashboard data
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

    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
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

    // Check if policy leakage dashboard is enabled for this tier
    if (!isFeatureEnabled('policyLeakageDashboard', agency.subscriptionTier as SubscriptionTier)) {
      return NextResponse.json({ 
        error: 'Policy Leakage Dashboard not available in your plan',
        upgradeMessage: 'Upgrade to Growth plan to access the Policy Leakage Dashboard'
      }, { status: 403 });
    }

    // Get risk data
    const [policyRisks, agencySummary] = await Promise.all([
      calculatePolicyRisk(agencyId),
      getAgencyRiskSummary(agencyId),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        policyRisks,
        agencySummary,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error fetching risk dashboard data', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
