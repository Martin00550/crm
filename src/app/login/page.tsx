import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function LoginPage() {
  const host = (await headers()).get('host') || '';
  const isLocalhost = host.includes('localhost');
  const parts = host.split('.');
  
  let subdomain = '';
  if (isLocalhost) {
    if (parts.length > 1 && !parts[0].includes('localhost')) {
      subdomain = parts[0];
    }
  } else {
    if (parts.length > 2) {
      subdomain = parts[0];
    }
  }

  // If we are on a subdomain, we stay on the branded portal login
  // The middleware will have already rewritten this, but this is a safety fallback
  if (subdomain && !['www', 'app', 'api', 'dashboard'].includes(subdomain.toLowerCase())) {
    return redirect(`/portal/${subdomain}/login`);
  }

  // Otherwise, we are an Agent trying to access the main platform
  redirect('/api/auth/login');
}
