import crypto from 'crypto';
import { getCached, setCached, deleteCached } from '@/lib/redis';

/**
 * CSRF Protection Utilities
 * Protects against Cross-Site Request Forgery attacks
 */

// Token expiration time (24 hours)
const CSRF_TOKEN_TTL = 24 * 60 * 60; // 24 hours in seconds

// Allowed origins for CSRF protection
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'];

/**
 * Generate a CSRF token for a session
 */
export async function generateCsrfToken(sessionId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const key = `csrf:${sessionId}`;
  
  // Store in Redis with TTL
  await setCached(key, token, CSRF_TOKEN_TTL);
  
  return token;
}

/**
 * Validate a CSRF token
 */
export async function validateCsrfToken(sessionId: string, token: string): Promise<boolean> {
  const key = `csrf:${sessionId}`;
  
  // Get stored token from Redis
  const stored = await getCached(key);
  
  if (!stored) {
    return false;
  }
  
  // Check if token matches
  if (stored !== token) {
    return false;
  }
  
  // Token is valid, consume it (optional - remove if you want reusable tokens)
  await deleteCached(key);
  
  return true;
}


/**
 * Get CSRF token from request headers or body
 */
export function getCsrfTokenFromRequest(request: Request): string | null {
  // Check header first (preferred)
  const headerToken = request.headers.get('x-csrf-token');
  if (headerToken) return headerToken;
  
  // Check for custom header format
  const customHeader = request.headers.get('x-requested-with');
  if (customHeader === 'XMLHttpRequest') {
    // XMLHttpRequest is a common CSRF protection header
    // This is a weaker protection but still useful
    return 'xhr';
  }
  
  return null;
}

/**
 * Verify Origin/Referer headers for CSRF protection
 * This is an additional layer of protection
 */
export function verifyOrigin(request: Request, allowedOrigins: string[]): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // If both are missing, this might be a direct API call (suspicious for browser requests)
  if (!origin && !referer) {
    // Check if this is a browser request
    const userAgent = request.headers.get('user-agent');
    if (userAgent && userAgent.includes('Mozilla')) {
      // Browser request without origin/referer is suspicious
      return false;
    }
    // Non-browser requests (like curl) are allowed without origin
    return true;
  }
  
  // Check origin if present
  if (origin) {
    try {
      const originUrl = new URL(origin);
      return allowedOrigins.some(allowed => {
        const allowedUrl = new URL(allowed);
        return originUrl.origin === allowedUrl.origin;
      });
    } catch {
      return false;
    }
  }
  
  // Check referer if present
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      return allowedOrigins.some(allowed => {
        const allowedUrl = new URL(allowed);
        return refererUrl.origin === allowedUrl.origin;
      });
    } catch {
      return false;
    }
  }
  
  return false;
}

/**
 * Middleware helper for CSRF protection
 */
export function withCsrfProtection(
  handler: (request: Request) => Promise<Response>,
  options: {
    allowedOrigins: string[];
    sessionIdExtractor?: (request: Request) => string | null;
  }
) {
  return async (request: Request): Promise<Response> => {
    // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
    const method = request.method.toUpperCase();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return handler(request);
    }
    
    // Verify origin first
    if (!verifyOrigin(request, options.allowedOrigins)) {
      return new Response(JSON.stringify({ error: 'Invalid origin' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // For state-changing requests, verify CSRF token
    const sessionId = options.sessionIdExtractor?.(request);
    if (sessionId) {
      const token = getCsrfTokenFromRequest(request);
      
      if (!token) {
        return new Response(JSON.stringify({ error: 'Missing CSRF token' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Allow XHR requests with X-Requested-With header
      if (token !== 'xhr' && !(await validateCsrfToken(sessionId, token))) {
        return new Response(JSON.stringify({ error: 'Invalid CSRF token' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    return handler(request);
  };
}

/**
 * Get allowed origins from environment
 */
export function getAllowedOrigins(): string[] {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const origins = [appUrl];
  
  // Add common development origins
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000');
    origins.push('http://127.0.0.1:3000');
  }
  
  return origins;
}
