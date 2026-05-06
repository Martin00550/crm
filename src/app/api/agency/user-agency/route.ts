import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { getUserAgencyId } from '@/actions/data';
import { logger } from '@/lib/logger';

// GET /api/agency/user-agency - Get current user's agency ID
export async function GET(request: NextRequest) {
  try {
    const { userId } = await getAuth();
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const agencyId = await getUserAgencyId(userId);
    
    return NextResponse.json({
      success: true,
      agencyId: agencyId || null,
    });
  } catch (error) {
    logger.error('Error in /api/agency/user-agency:', error);
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    
    logger.info('Request Context:', {
      hasAuth: !!authHeader,
      hasCookies: !!cookieHeader,
      url: request.url,
      method: request.method
    });

    return NextResponse.json({ 
      success: false, 
      error: 'API_SESSION_ERROR',
      message: error instanceof Error ? error.message : 'Session verification failed at the API level' 
    }, { status: 200 }); 
  }
}
