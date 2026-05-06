import { getSignUpUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tier = searchParams.get('tier') || 'solo';
  
  // Set the tier cookie server-side for onboarding flow
  const cookieStore = await cookies();
  cookieStore.set('selected_tier', tier, { 
    path: '/', 
    maxAge: 3600,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });

  const url = await getSignUpUrl({ 
    redirectUri: process.env.WORKOS_REDIRECT_URI,
  });
  
  return redirect(url);
}
