import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { agencies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { generateClientPortalInvite, getClientPortalData } from '@/lib/client-portal';
import { isFeatureEnabled, SubscriptionTier } from '@/lib/features';
import { getUserAgencyId } from '@/actions/data';
import { logger } from '@/lib/logger';

import { withApiSecurity } from '@/lib/api-security';

// POST /api/portal/invite - Generate portal invitation for a client
export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    try {
      const { agencyId } = context;

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

      // Check if white-labeled portal is enabled for this tier
      if (!isFeatureEnabled('whiteLabelPortal', agency.subscriptionTier as SubscriptionTier)) {
        return NextResponse.json({ 
          error: 'White-Labeled Portal not available in your plan',
          upgradeMessage: 'Upgrade to Enterprise plan to access the White-Labeled Client Portal'
        }, { status: 403 });
      }

      const { clientId } = await request.json();

      if (!clientId) {
        return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
      }

      // Generate portal invitation
      const inviteData = await generateClientPortalInvite(clientId, agencyId);

      if (!inviteData) {
        return NextResponse.json({ error: 'Failed to generate portal invitation' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        invite: inviteData,
      });
    } catch (error) {
      logger.error('Error generating portal invitation', error);
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
