import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

export async function GET() {
  // Use screen_hint=sign-up for direct sign-up
  const url = await getSignInUrl({ 
    redirectUri: process.env.WORKOS_REDIRECT_URI,
  });
  return redirect(url);
}
