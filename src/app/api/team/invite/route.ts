import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { createInvitation } from '@/lib/team-access';
import { getUserAgencyId } from '@/actions/data';
import { UserRole } from '@/lib/permissions';

import { withApiSecurity } from '@/lib/api-security';
import { logger } from '@/lib/logger';

export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    try {
      const { agencyId, userId } = context;

      if (!agencyId) {
        return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
      }

      const body = await request.json();
      const { email, name, role } = body;

      if (!email || !name) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Create invitation using our own system
      const result = await createInvitation(
        agencyId,
        email,
        name,
        (role as UserRole) || 'producer'
      );
      
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Invitation sent',
        invitationId: result.invitationId 
      });
    } catch (error) {
      logger.error('Error inviting team member', error);
      return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
    }
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
  }
);
