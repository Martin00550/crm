import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { acceptInvitation } from '@/lib/team-access';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// POST /api/invite/[token]/accept - Accept invitation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { userId } = await getAuth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in to accept invitation' }, { status: 401 });
    }

    const result = await acceptInvitation(token, userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Invitation accepted successfully'
    });
  } catch (error) {
    logger.error('Error accepting invitation', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
