import { withAuth } from '@workos-inc/authkit-nextjs';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET() {
  const session = await withAuth();
  logger.debug('API /session - User ID', { userId: session.user?.id });
  return NextResponse.json(session);
}
