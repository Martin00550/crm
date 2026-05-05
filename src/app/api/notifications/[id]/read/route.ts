import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserAgencyId } from '@/actions/data';
import { logger } from '@/lib/logger';

// POST /api/notifications/[id]/read - Mark notification as read
export async function POST(
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

    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Update notification as read
    const result = await db
      .update(notifications)
      .set({ 
        read: true,
        updatedAt: new Date(),
      })
      .where(and(
        eq(notifications.id, id),
        eq(notifications.userId, userId),
        eq(notifications.agencyId, agencyId)
      ))
      .returning()
      .then((r: any[]) => r[0]);

    if (!result) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      notification: {
        id: result.id,
        read: result.read,
      },
    });
  } catch (error) {
    logger.error('Error marking notification as read', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
