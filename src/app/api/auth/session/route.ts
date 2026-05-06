import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await withAuth();
    
    // Ensure we return a consistent structure that useWorkOSClient expects
    return NextResponse.json({
      user: session.user || null,
      organizationId: session.organizationId || null,
      role: session.role || null,
      permissions: session.permissions || []
    });
  } catch (error) {
    logger.error('API /session - Error', error);
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
