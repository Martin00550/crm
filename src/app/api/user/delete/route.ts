import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuth } from '@/lib/auth-wrapper';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    // Delete from app users table (WorkOS handles user deletion on their side)
    await db.delete(users).where(eq(users.workosUserId, userId));

    return NextResponse.json({ success: true, message: 'Account decommissioned successfully' });
  } catch (error) {
    logger.error('Delete user error', error);
    return NextResponse.json({ error: 'Failed to decommission account' }, { status: 500 });
  }
}
