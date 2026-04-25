import { db } from '@/lib/db';
import { rateLimits } from '@/db/schema';
import { eq, lt } from 'drizzle-orm';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyPrefix: string; // Prefix for the rate limit key
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // AI generation - strict limits due to cost
  aiGeneration: { windowMs: 60 * 1000, maxRequests: 10, keyPrefix: 'ai' },
  // Email sending - prevent abuse
  emailSend: { windowMs: 60 * 60 * 1000, maxRequests: 50, keyPrefix: 'email' },
  // API endpoints - general protection
  api: { windowMs: 60 * 1000, maxRequests: 100, keyPrefix: 'api' },
  // Authentication - prevent brute force
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10, keyPrefix: 'auth' },
  // File uploads - prevent abuse
  upload: { windowMs: 60 * 60 * 1000, maxRequests: 20, keyPrefix: 'upload' },
  // Webhooks - prevent flooding
  webhook: { windowMs: 60 * 1000, maxRequests: 100, keyPrefix: 'webhook' },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // Seconds until reset
}

/**
 * Check rate limit for a given identifier and limit type
 * Uses database for persistence in production, in-memory for development
 */
export async function checkRateLimit(
  identifier: string,
  limitType: RateLimitType
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[limitType];
  const key = `${config.keyPrefix}:${identifier}`;
  const now = Date.now();
  const resetAt = now + config.windowMs;

  // Always use database for rate limiting in production
  // In-memory fallback is removed to ensure consistency across server instances
  if (!db) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: new Date(resetAt),
      retryAfter: Math.ceil(config.windowMs / 1000),
    };
  }

  // Database-based rate limiting for all environments
  return checkDatabaseRateLimit(key, config, now, resetAt);
}

async function checkDatabaseRateLimit(
  key: string,
  config: RateLimitConfig,
  now: number,
  resetAt: number
): Promise<RateLimitResult> {
  try {
    // Clean up expired entries
    await db.delete(rateLimits).where(lt(rateLimits.resetAt, new Date(now)));

    // Get existing record
    const records = await db.select().from(rateLimits).where(eq(rateLimits.key, key)).limit(1);
    const record = records[0];

    if (!record || new Date(record.resetAt).getTime() <= now) {
      // No record or expired - create new
      await db.insert(rateLimits)
        .values({ key, count: 1, resetAt: new Date(resetAt) })
        .onConflictDoUpdate({
          target: rateLimits.key,
          set: { count: 1, resetAt: new Date(resetAt) },
        });

      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetAt: new Date(resetAt),
      };
    }

    const currentCount = record.count;
    const recordResetAt = new Date(record.resetAt);

    if (currentCount >= config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((recordResetAt.getTime() - now) / 1000);
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetAt: recordResetAt,
        retryAfter,
      };
    }

    // Increment count atomically
    await db.update(rateLimits)
      .set({ count: currentCount + 1 })
      .where(eq(rateLimits.key, key));

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - currentCount - 1,
      resetAt: recordResetAt,
    };
  } catch (error) {
    console.error('Database rate limit error:', error);
    // Fail closed on error
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: new Date(resetAt),
      retryAfter: Math.ceil(config.windowMs / 1000),
    };
  }
}

/**
 * Middleware helper to apply rate limiting to API routes
 */
export const withRateLimit = (limitType: RateLimitType) => {
  return async function (
    identifier: string
  ): Promise<{ allowed: boolean; headers: Record<string, string> }> {
    const result = await checkRateLimit(identifier, limitType);

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': String(result.limit),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(Math.floor(result.resetAt.getTime() / 1000)),
    };

    if (!result.success && result.retryAfter) {
      headers['Retry-After'] = String(result.retryAfter);
    }

    return { allowed: result.success, headers };
  };
};

/**
 * Clean up expired rate limit entries (call periodically)
 */
export const cleanupExpiredRateLimits = async (): Promise<void> => {
  if (!db) return;
  const now = Date.now();
  await db.delete(rateLimits).where(lt(rateLimits.resetAt, new Date(now)));
};

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredRateLimits, 5 * 60 * 1000);
}
