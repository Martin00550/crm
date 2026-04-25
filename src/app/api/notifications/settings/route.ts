import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { agencies } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not connected' }, { status: 500 });
    }

    const { agencyId, settings } = await request.json();

    // Get current branding
    const agency = await db
      .select()
      .from(agencies)
      .where(eq(agencies.id, agencyId))
      .then((r: any[]) => r[0]);

    if (!agency) {
      return NextResponse.json({ error: 'Agency not found' }, { status: 404 });
    }

    // Merge notification settings into branding
    const updatedBranding = {
      ...agency.branding,
      renewalNotifications: settings.renewalNotifications,
      email90Day: settings.email90Day,
      email60Day: settings.email60Day,
      email30Day: settings.email30Day,
      notifyOnExpiry: settings.notifyOnExpiry,
      dailyDigest: settings.dailyDigest,
      commissionAlerts: settings.commissionAlerts,
    };

    // Update agency branding
    await db
      .update(agencies)
      .set({
        branding: updatedBranding,
        updatedAt: new Date(),
      })
      .where(eq(agencies.id, agencyId));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to save notification settings:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
