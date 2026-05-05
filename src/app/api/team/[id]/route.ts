import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { removeTeamMember, updateTeamMemberRole } from '@/lib/team-access';
import { getUserAgencyId } from '@/actions/data';
import { UserRole } from '@/lib/permissions';
import { logger } from '@/lib/logger';

// GET /api/team/[id] - Get team member details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await getAuth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agencyId = await getUserAgencyId(userId);
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // For now, return basic info. In a full implementation, you'd fetch member details
    return NextResponse.json({ 
      success: true,
      message: 'Member details endpoint - to be implemented'
    });
  } catch (error) {
    logger.error('Error fetching team member', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/team/[id] - Update team member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await getAuth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agencyId = await getUserAgencyId(userId);
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role || !['owner', 'admin', 'csr', 'producer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Update team member role
    const result = await updateTeamMemberRole(id, agencyId, role as UserRole);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Team member role updated successfully'
    });
  } catch (error) {
    logger.error('Error updating team member', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/team/[id] - Remove team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await getAuth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agencyId = await getUserAgencyId(userId);
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Remove team member
    const result = await removeTeamMember(id, agencyId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (error) {
    logger.error('Error removing team member', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
