import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invitations, agencies } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// GET /api/invite/[token] - Verify invitation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!db) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }
    const invitation = await db
      .select({
        id: invitations.id,
        email: invitations.email,
        name: invitations.name,
        role: invitations.role,
        status: invitations.status,
        expiresAt: invitations.expiresAt,
        agencyId: invitations.agencyId,
      })
      .from(invitations)
      .where(and(
        eq(invitations.token, token),
        eq(invitations.status, 'pending'),
        gt(invitations.expiresAt, new Date())
      ))
      .limit(1)
      .then((r: any[]) => r[0]);

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
    }

    // Get agency name
    const agency = await db
      .select({ name: agencies.name })
      .from(agencies)
      .where(eq(agencies.id, invitation.agencyId))
      .limit(1)
      .then((r: any[]) => r[0]);

    const roleLabels: Record<string, string> = {
      owner: 'Agency Owner',
      admin: 'Administrator',
      csr: 'Customer Service Representative',
      producer: 'Sales Producer',
    };

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        role: invitation.role,
        roleLabel: roleLabels[invitation.role] || invitation.role,
        agencyName: agency?.name || 'Unknown Agency',
      }
    });
  } catch (error) {
    logger.error('Error verifying invitation', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
