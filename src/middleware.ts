import { NextRequest, NextResponse, NextFetchEvent } from 'next/server';
import { authkitProxy } from '@workos-inc/authkit-nextjs';
import { checkRateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

export const runtime = 'experimental-edge';

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. GLOBAL DDoS PROTECTION (Edge Rate Limiting)
  // Protect all non-static routes from volumetric L7 attacks
  if (
    !url.pathname.startsWith('/_next') && 
    !url.pathname.includes('.') && 
    process.env.NODE_ENV === 'production'
  ) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'anonymous';
    
    // Global limit: 300 requests per minute per IP
    // This is high enough for legitimate use but blocks brute-force/DDoS scripts
    const rateLimit = await checkRateLimit(ip, 'api');
    
    if (!rateLimit.success) {
      logger.warn('Global rate limit triggered', { ip, path: url.pathname });
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.retryAfter || 60)
          } 
        }
      );
    }
  }

  // 2. Identify the environment
  const isDevelopment = process.env.NODE_ENV === 'development';
  const rootDomain = isDevelopment ? 'localhost:3000' : 'retainvault.com';
  
  // 2. Optimized Public Route Check
  const isPublicRoute = 
    url.pathname === '/' || 
    url.pathname === '/pricing' || 
    url.pathname === '/demo' || 
    url.pathname.startsWith('/demo/') || 
    url.pathname === '/api/inngest' ||
    url.pathname.startsWith('/api/auth/');

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
  if (isPublicRoute || process.env.MOCK_AUTH === 'true') {
    return NextResponse.next();
  }

  // Use a more dynamic approach for production to handle preview domains
  const actualRedirectUri = isDevelopment 
    ? `http://${hostname}/api/auth/callback` 
    : (process.env.WORKOS_REDIRECT_URI || `https://${hostname}/api/auth/callback`);

  return authkitProxy({
    debug: isDevelopment,
    redirectUri: actualRedirectUri,
  })(request, event);
}

export default middleware;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json (PWA manifest)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.json).*)',
  ],
};
