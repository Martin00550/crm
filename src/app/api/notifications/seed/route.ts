import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { 
  createPolicyRenewalNotification,
  createCommissionPaymentNotification,
  createRateChangeNotification,
  createPolicyUpdateNotification
} from '@/lib/notifications';

// POST /api/notifications/seed - Create sample notifications
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const { userId } = await getAuth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user info
    const user = await db
      .select({ agencyId: users.agencyId })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create sample notifications
    const notifications = await Promise.all([
      createPolicyRenewalNotification(user.agencyId, userId, 3, 30),
      createCommissionPaymentNotification(user.agencyId, userId, 12450, new Date()),
      createRateChangeNotification(user.agencyId, userId, 'Chubb', 'premium adjustments'),
      createPolicyUpdateNotification(user.agencyId, userId, 'Travelers', 'guidelines'),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Sample notifications created',
      count: notifications.filter(n => n.success).length,
    });
  } catch (error) {
    logger.error('Error seeding notifications', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
