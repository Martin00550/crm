import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { createInvitation } from '@/lib/team-access';
import { getUserAgencyId } from '@/actions/data';
import { UserRole } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId, email, name, role } = body;

    if (!agencyId || !email || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify user belongs to agency
    const userAgencyId = await getUserAgencyId(userId);
    if (userAgencyId !== agencyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
  } catch (error: any) {
    console.error('Error inviting team member:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}
