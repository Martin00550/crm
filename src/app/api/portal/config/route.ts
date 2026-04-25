import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { users, agencies } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getPortalConfig, updatePortalConfig } from '@/lib/client-portal';
import { isFeatureEnabled, SubscriptionTier } from '@/lib/features';
import { getUserAgencyId } from '@/actions/data';

// GET /api/portal/config - Get portal configuration
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

    // Check if white-labeled portal is enabled for this tier
    if (!isFeatureEnabled('whiteLabelPortal', agency.subscriptionTier as SubscriptionTier)) {
      return NextResponse.json({ 
        error: 'White-Labeled Portal not available in your plan',
        upgradeMessage: 'Upgrade to Enterprise plan to access the White-Labeled Client Portal'
      }, { status: 403 });
    }

    const config = await getPortalConfig(agencyId);
    
    if (!config) {
      return NextResponse.json({ error: 'Portal not configured' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Error fetching portal config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/portal/config - Update portal configuration
export async function PUT(request: NextRequest) {
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

    // Check if white-labeled portal is enabled for this tier
    if (!isFeatureEnabled('whiteLabelPortal', agency.subscriptionTier as SubscriptionTier)) {
      return NextResponse.json({ 
        error: 'White-Labeled Portal not available in your plan',
        upgradeMessage: 'Upgrade to Enterprise plan to access the White-Labeled Client Portal'
      }, { status: 403 });
    }

    const configData = await request.json();

    // Validate required fields
    if (!configData.subdomain) {
      return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 });
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;
    if (!subdomainRegex.test(configData.subdomain)) {
      return NextResponse.json({ 
        error: 'Invalid subdomain format. Use only lowercase letters, numbers, and hyphens.' 
      }, { status: 400 });
    }

    const success = await updatePortalConfig(agencyId, configData);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update portal configuration' }, { status: 500 });
    }

    const updatedConfig = await getPortalConfig(agencyId);

    return NextResponse.json({
      success: true,
      config: updatedConfig,
    });
  } catch (error) {
    console.error('Error updating portal config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
