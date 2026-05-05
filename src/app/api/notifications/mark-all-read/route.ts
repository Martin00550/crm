import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserAgencyId } from '@/actions/data';
import { logger } from '@/lib/logger';

// POST /api/notifications/mark-all-read - Mark all notifications as read
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

    // Update all unread notifications as read
    const result = await db
      .update(notifications)
      .set({ 
        read: true,
        updatedAt: new Date(),
      })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.agencyId, agencyId),
        eq(notifications.read, false)
      ))
      .returning({ id: notifications.id })
      .then((r: any[]) => r);

    return NextResponse.json({
      success: true,
      markedAsRead: result.length,
    });
  } catch (error) {
    logger.error('Error marking all notifications as read', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
