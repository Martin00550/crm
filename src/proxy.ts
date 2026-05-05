import { NextRequest, NextResponse } from 'next/server';
import { authkitProxy } from '@workos-inc/authkit-nextjs';

export default async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. Identify the environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  const rootDomain = isDevelopment ? 'localhost:3000' : 'retainvault.com';
  
  // 2. Explicitly bypass public routes
  if (url.pathname.startsWith('/demo') || url.pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // 3. Handle Subdomain Routing (Wildcard)
  const isSubdomain = hostname !== rootDomain && hostname !== `www.${rootDomain}`;

  if (isSubdomain) {
    const subdomain = hostname.split('.')[0];
    
    // Only rewrite if it's not a system route
    if (
      !url.pathname.startsWith('/api') && 
      !url.pathname.startsWith('/_next') && 
      !url.pathname.includes('.')
    ) {
      return NextResponse.rewrite(new URL(`/portal/${subdomain}${url.pathname}`, request.url));
    }
  }

  // 4. Handle WorkOS Auth Bridge for Dashboard & App routes using the new Proxy convention
  return authkitProxy({
    debug: isDevelopment,
    redirectUri: process.env.WORKOS_REDIRECT_URI,
  })(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
