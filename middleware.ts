import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/sign-in',
  '/sign-up',
  '/api/auth',
  '/pricing',
  '/demo',
  '/invite/',
  '/portal/',
];

// Define ignored routes (webhooks, etc.)
const ignoredRoutes = [
  '/api/webhooks/',
  '/api/inngest',
  '/_next/',
  '/favicon.ico',
];

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );
}

function isIgnoredRoute(pathname: string): boolean {
  return ignoredRoutes.some(route => pathname.startsWith(route));
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip ignored routes
  if (isIgnoredRoute(pathname)) {
    return NextResponse.next();
  }

  // Allow public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie on protected routes
  const sessionCookie = getSessionCookie(request);
  
  if (!sessionCookie) {
    // Redirect to sign-in if no session
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
