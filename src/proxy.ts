import { NextRequest, NextResponse, NextFetchEvent } from 'next/server';
import { authkitProxy } from '@workos-inc/authkit-nextjs';

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. Identify the environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  const rootDomain = isDevelopment ? 'localhost:3000' : 'retainvault.com';
  
  // 2. Explicitly bypass public routes for the auth check
  const publicRoutes = ['/', '/pricing', '/demo', '/demo/:path*', '/api/auth/:path*'];
  const isPublicRoute = publicRoutes.some(route => {
    if (route.includes(':path*')) {
      return url.pathname.startsWith(route.replace(':path*', ''));
    }
    return url.pathname === route;
  });

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

  // 4. Handle WorkOS Auth Bridge
  if (isPublicRoute) {
    return NextResponse.next();
  }

  return authkitProxy({
    debug: isDevelopment,
    redirectUri: process.env.WORKOS_REDIRECT_URI,
  })(request, event);
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
