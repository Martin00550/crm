import { getCacheClient } from './cache';
import { logger } from '@/lib/logger';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyPrefix: string; // Prefix for the rate limit key
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // AI generation - strict limits due to cost
  aiGeneration: { windowMs: 60 * 1000, maxRequests: 5, keyPrefix: 'ai' },
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
 * Check rate limit for a given identifier and limit type using distributed Redis
 */
export async function checkRateLimit(
  identifier: string,
  limitType: RateLimitType
): Promise<RateLimitResult> {
  const config = RATE_LIMITS[limitType];
  const key = `ratelimit:${config.keyPrefix}:${identifier}`;
  
  const client = getCacheClient();
  
  if (!client) {
    logger.warn('Redis not available, failing open on rate limit', { key });
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetAt: new Date(Date.now() + config.windowMs),
    };
  }

  try {
    const now = Date.now();
    
    // Use Redis INCR and PTTL for an atomic rate limit check
    const currentCount = await client.incr(key);
    
    if (currentCount === 1) {
      // First request in the window, set expiry
      await client.pexpire(key, config.windowMs);
    }
    
    const pttl = await client.pttl(key);
    const resetAt = new Date(now + (pttl > 0 ? pttl : config.windowMs));

    if (currentCount > config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil((resetAt.getTime() - now) / 1000),
      };
    }

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - currentCount,
      resetAt,
    };
  } catch (error) {
    logger.error('Distributed rate limit error', error);
    // Fail open to prevent blocking legitimate users if Redis is down
    return {
      success: true,
      limit: config.maxRequests,
      remaining: 1,
      resetAt: new Date(Date.now() + config.windowMs),
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

