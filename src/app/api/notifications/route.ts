import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { notifications } from '@/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { withApiSecurity } from '@/lib/api-security';

// GET /api/notifications - Get user notifications
export const GET = withApiSecurity(
  async (request: NextRequest, context) => {
    const { userId: workosUserId, agencyId } = context;

    if (!agencyId || !workosUserId) {
      return NextResponse.json({ error: 'Agency ID and User ID required' }, { status: 400 });
    }

    // Look up DB user ID to avoid UUID mismatch
    const { users } = await import('@/db/schema');
    const user = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.workosUserId, workosUserId))
      .limit(1)
      .then(r => r[0]);

    if (!user) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const userId = user.id;

    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const whereConditions = [
      eq(notifications.agencyId, agencyId),
      eq(notifications.userId, userId),
    ];

    if (unreadOnly) {
      whereConditions.push(eq(notifications.read, false));
    }

    const userNotifications = await db
      .select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
        type: notifications.type,
        read: notifications.read,
        metadata: notifications.metadata,
        createdAt: notifications.createdAt,
        updatedAt: notifications.updatedAt,
      })
      .from(notifications)
      .where(and(...whereConditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    // Format for frontend
    const formattedNotifications = userNotifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read,
      time: formatRelativeTime(notification.createdAt),
      metadata: notification.metadata,
    }));

    const unreadCount = userNotifications.filter((n) => !n.read).length;

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      unreadCount,
    });
  },
  {
    requireAuth: true,
    requireAgency: true,
    rateLimit: 'api',
    auditAction: 'notifications.list',
  }
);

// POST /api/notifications - Create notification
export const POST = withApiSecurity(
  async (request: NextRequest, context) => {
    const { userId, agencyId } = context;

    if (!agencyId) {
      return NextResponse.json({ error: 'Agency ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { title, message, type, metadata, targetUserId } = body;

    if (!title || !message || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create notification
    const result = await db
      .insert(notifications)
      .values({
        agencyId,
        userId: targetUserId || userId, // Can create for self or other users
        title,
        message,
        type,
        metadata: metadata || null,
        read: false,
      })
      .returning()
      .then(r => r[0]);

    return NextResponse.json({
      success: true,
      notification: {
        id: result.id,
        title: result.title,
        message: result.message,
        type: result.type,
        read: result.read,
        time: formatRelativeTime(result.createdAt),
        metadata: result.metadata,
      },
    });
  },
  {
    requireAuth: true,
    requireAgency: true,
    enableCsrf: true,
    rateLimit: 'api',
    auditAction: 'notification.create',
  }
);

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
}
