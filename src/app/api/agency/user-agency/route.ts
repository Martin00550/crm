import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { getUserAgencyId } from '@/actions/data';

// GET /api/agency/user-agency - Get current user's agency ID
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

    return NextResponse.json({
      success: true,
      agencyId,
    });
  } catch (error) {
    console.error('Error getting user agency:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
