import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/better-auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: session.user,
      session: session.session,
    });
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
