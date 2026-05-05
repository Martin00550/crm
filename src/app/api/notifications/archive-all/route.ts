import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { notifications } from '@/db/schema';
import { and, eq } from 'drizzle-orm';
import { getUserAgencyId } from '@/actions/data';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agencyId = await getUserAgencyId(userId);
    if (!agencyId) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Delete all notifications for this user in this agency
    const result = await db
      .delete(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.agencyId, agencyId)
      ));

    return NextResponse.json({ 
      success: true, 
      message: 'All notifications archived' 
    });
  } catch (error) {
    logger.error('Error archiving notifications', error);
    return NextResponse.json({ error: 'Failed to archive notifications' }, { status: 500 });
  }
}
