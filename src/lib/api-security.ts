import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth-wrapper';
import { checkRateLimit } from '@/lib/rate-limit';
import { logAuditEvent, extractRequestMetadata } from '@/lib/audit';
import { verifyOrigin, getAllowedOrigins } from '@/lib/csrf';
import { checkIPWhitelist, getClientIP } from '@/lib/ip-whitelist';
import { Errors, createErrorResponse, logError } from '@/lib/error-handler';

/**
 * API Route Security Wrapper
 * Provides consistent security for all API routes
 */

export interface ApiRouteOptions {
  // Rate limiting
  rateLimit?: 'api' | 'aiGeneration' | 'emailSend' | 'upload' | 'auth';
  
  // Authentication requirements
  requireAuth?: boolean;
  requireAgency?: boolean;
  
  // RBAC - required permission for this action
  requiredPermission?: string;
  
  // CSRF protection
  enableCsrf?: boolean;
  
  // Allowed methods
  methods?: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[];
  
  // Audit logging
  auditAction?: string;
  
  // IP whitelist for admin operations
  requireIPWhitelist?: boolean;
  
  // Custom validation
  validate?: (request: NextRequest) => Promise<{ valid: boolean; error?: string }>;
}

/**
 * Wrap an API route handler with security middleware
 */
export function withApiSecurity(
  handler: (request: NextRequest, context: { userId: string | null; agencyId: string | null }) => Promise<NextResponse>,
  options: ApiRouteOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    let userId: string | null = null;
    let agencyId: string | null = null;
    
    try {
      // 1. Method validation
      if (options.methods && !options.methods.includes(request.method as any)) {
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405, headers: { Allow: options.methods.join(', ') } }
        );
      }

      // 2. CSRF protection for state-changing methods
      if (options.enableCsrf && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method as any)) {
        const allowedOrigins = getAllowedOrigins();
        if (!verifyOrigin(request, allowedOrigins)) {
          return NextResponse.json(
            { error: 'Invalid origin' },
            { status: 403 }
          );
        }
      }

      // 3. IP whitelist check (for admin operations)
      if (options.requireIPWhitelist) {
        const clientIP = getClientIP(request);
        const ipCheck = checkIPWhitelist(clientIP);
        
        if (!ipCheck.allowed) {
          const error = Errors.authorization(ipCheck.error || 'IP address not authorized');
          logError(error, { ip: clientIP });
          return NextResponse.json(createErrorResponse(error), { status: error.statusCode });
        }
      }

      // 4. Rate limiting
      if (options.rateLimit) {
        // Get identifier (prefer user ID, fall back to IP)
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                   request.headers.get('x-real-ip') ||
                   'anonymous';
        
        const authData = await getAuth();
        const identifier = authData.userId || ip;
        
        const rateLimitResult = await checkRateLimit(identifier, options.rateLimit);
        
        if (!rateLimitResult.success) {
          const error = Errors.rateLimit(rateLimitResult.retryAfter);
          logError(error, { identifier, type: options.rateLimit });
          return NextResponse.json(createErrorResponse(error), {
            status: error.statusCode,
            headers: {
              'Retry-After': String(rateLimitResult.retryAfter || 60),
              'X-RateLimit-Limit': String(rateLimitResult.limit),
              'X-RateLimit-Remaining': String(rateLimitResult.remaining),
              'X-RateLimit-Reset': String(Math.floor(rateLimitResult.resetAt.getTime() / 1000)),
            },
          });
        }
      }

      // 5. Authentication
      if (options.requireAuth || options.requireAgency) {
        const authResult = await getAuth();
        userId = authResult.userId;

        if (!userId) {
          const error = Errors.authentication();
          logError(error, { url: request.url });
          return NextResponse.json(createErrorResponse(error), { status: error.statusCode });
        }

        // 5. Agency membership check
        if (options.requireAgency) {
          const { getUserAgencyId } = await import('@/actions/data');
          agencyId = await getUserAgencyId(userId);
          
          if (!agencyId) {
            const error = Errors.authorization('Agency membership required');
            logError(error, { userId });
            return NextResponse.json(createErrorResponse(error), { status: error.statusCode });
          }
        }
      }

      // 6. RBAC Permission check
      if (options.requiredPermission && userId) {
        const { hasPermission } = await import('@/lib/permissions');
        const { db } = await import('@/lib/db');
        const { users } = await import('@/db/schema');
        const { eq } = await import('drizzle-orm');
        
        const user = await db
          ?.select({ role: users.role })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1)
          .then((r: any[]) => r[0]);
        
        if (!user?.role || !hasPermission(user.role as any, options.requiredPermission)) {
          const error = Errors.authorization('Insufficient permissions');
          logError(error, { userId, requiredPermission: options.requiredPermission });
          return NextResponse.json(createErrorResponse(error), { status: error.statusCode });
        }
      }

      // 7. Custom validation
      if (options.validate) {
        const validation = await options.validate(request);
        if (!validation.valid) {
          const error = Errors.validation(validation.error || 'Validation failed');
          logError(error, { url: request.url });
          return NextResponse.json(createErrorResponse(error), { status: error.statusCode });
        }
      }

      // 8. Execute handler
      const response = await handler(request, { userId, agencyId });

      // 9. Audit logging
      if (options.auditAction && userId) {
        const metadata = await extractRequestMetadata(request);
        await logAuditEvent({
          agencyId: agencyId || undefined,
          userId,
          action: options.auditAction as any,
          status: response.ok ? 'success' : 'failure',
          ipAddress: metadata.ipAddress,
          userAgent: metadata.userAgent,
        });
      }

      // 10. Add security headers to response
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);

      return response;
    } catch (error: any) {
      console.error('API route error:', error);
      
      // Log error
      if (options.auditAction) {
        try {
          const metadata = await extractRequestMetadata(request);
          await logAuditEvent({
            agencyId: agencyId || undefined,
            userId: userId || undefined,
            action: options.auditAction as any,
            status: 'failure',
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent,
            errorMessage: error.message,
          });
        } catch (auditError) {
          console.error('Error logging audit event in catch block:', auditError);
        }
      }
      
      const apiError = error instanceof Error ? Errors.server(error.message) : Errors.server();
      logError(apiError, { url: request.url, method: request.method });
      
      return NextResponse.json(createErrorResponse(apiError), { status: apiError.statusCode });
    }

  };
}

/**
 * Validate request body against a schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: any
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (result.success) {
      return { success: true, data: result.data };
    }
    
    return {
      success: false,
      error: result.error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', '),
    };
  } catch {
    return { success: false, error: 'Invalid JSON body' };
  }
}

/**
 * Check if request has valid content type
 */
export function validateContentType(request: NextRequest, expected: string): boolean {
  const contentType = request.headers.get('content-type');
  return contentType?.includes(expected) ?? false;
}

/**
 * Create a standardized error response
 */
export function apiError(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Create a standardized success response
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}
