import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getClientPortalData, validatePortalToken } from '@/lib/client-portal';
import { logger } from '@/lib/logger';

// GET /api/portal/invite/[token] - Validate portal invitation token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const tokenData = await validatePortalToken(token);

    if (!tokenData) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Get client portal data
    const portalData = await getClientPortalData(tokenData.clientId, tokenData.agencyId);

    if (!portalData) {
      return NextResponse.json({ error: 'Client not found or portal access disabled' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      client: portalData.client,
      policies: portalData.policies,
    });
  } catch (error) {
    logger.error('Error validating portal token', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
