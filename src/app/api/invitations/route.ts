import { NextRequest, NextResponse } from 'next/server';
import { getPendingInvitations, createInvitation } from '@/lib/team-access';
import { withApiSecurity } from '@/lib/api-security';

// GET /api/invitations - List pending invitations
export const GET = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId } = context;

    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pending';

    let invitations;
    if (status === 'pending') {
      invitations = await getPendingInvitations(agencyId);
    } else {
      // For future: add getAllInvitations function
      invitations = await getPendingInvitations(agencyId);
    }

    return NextResponse.json({ 
      success: true,
      invitations 
    });
  },
  {
    requireAuth: true,
    requireAgency: true,
    rateLimit: 'api',
    auditAction: 'invitations.list',
  }
);

// POST /api/invitations - Create new invitation
export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    const { agencyId } = context;

    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { email, name, role } = body;

    if (!email || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create invitation
    const result = await createInvitation(agencyId, email, name, role);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Invitation created successfully',
      invitationId: result.invitationId
    });
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
    auditAction: 'invitation.create',
  }
);
