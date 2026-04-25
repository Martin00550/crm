import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAuth } from '@/lib/auth-wrapper';
import { user, users, session, account, verification } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    // Delete user data in correct order (respecting foreign key constraints)
    
    // 1. Delete sessions
    await db.delete(session).where(eq(session.userId, userId));
    
    // 2. Delete accounts (OAuth)
    await db.delete(account).where(eq(account.userId, userId));
    
    // 3. Delete verification tokens
    await db.delete(verification).where(eq(verification.identifier, userId));
    
    // 4. Delete from app users table
    await db.delete(users).where(eq(users.id, userId));
    
    // 5. Delete from better-auth user table
    await db.delete(user).where(eq(user.id, userId));

    return NextResponse.json({ success: true, message: 'Account decommissioned successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to decommission account' }, { status: 500 });
  }
}
