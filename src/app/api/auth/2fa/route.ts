import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/better-auth';
import { withApiSecurity } from '@/lib/api-security';

// GET /api/auth/2fa - Check if 2FA is enabled for current user
export const GET = withApiSecurity(
  async (request: NextRequest, context) => {
    const { userId } = context;

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has 2FA enabled
    const twoFactorEnabled = session.user.twoFactorEnabled;

    return NextResponse.json({
      enabled: twoFactorEnabled,
    });
  },
  {
    requireAuth: true,
    rateLimit: 'auth',
    auditAction: '2fa.check',
  }
);

// POST /api/auth/2fa/enable - Enable 2FA for current user
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate 2FA secret
    const result = await auth.api.enableTwoFactor({
      headers: request.headers,
      body: {},
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error enabling 2FA:', error);
    return NextResponse.json({ error: 'Failed to enable 2FA' }, { status: 500 });
  }
}

// POST /api/auth/2fa/disable - Disable 2FA for current user
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await auth.api.disableTwoFactor({
      headers: request.headers,
      body: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return NextResponse.json({ error: 'Failed to disable 2FA' }, { status: 500 });
  }
}

// POST /api/auth/2fa/verify - Verify 2FA code
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Verification code required' }, { status: 400 });
    }

    const result = await auth.api.verifyTwoFactorOTP({
      headers: request.headers,
      body: { code },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error verifying 2FA:', error);
    return NextResponse.json({ error: 'Failed to verify 2FA code' }, { status: 500 });
  }
}
