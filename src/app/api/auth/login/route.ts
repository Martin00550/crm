import { getSignInUrl } from '@workos-inc/authkit-nextjs';
import { redirect } from 'next/navigation';

export async function GET() {
  const url = await getSignInUrl({
    redirectUri: process.env.WORKOS_REDIRECT_URI,
  });
  return redirect(url);
}
