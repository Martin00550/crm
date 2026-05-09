import { Redis } from '@upstash/redis';
import { logger } from './logger';

/**
 * Unified Edge-Ready Caching Layer
 * Uses Upstash Redis REST API for compatibility with Next.js Edge Runtime
 */

let redisClient: Redis | null = null;

export function getCacheClient(): Redis | null {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // Fallback to ioredis check if we are in Node.js, but for Edge we must have these
    if (typeof window === 'undefined' && process.env.REDIS_URL) {
      logger.warn('Upstash REST credentials missing. Edge caching will be disabled.');
    }
    return null;
  }

  try {
    redisClient = new Redis({
      url,
      token,
    });
    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Upstash Redis', error);
    return null;
  }
}

/**
 * Cache Wrapper for any fetch operation
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const client = getCacheClient();
  
  if (!client) {
    return fetchFn();
  }

  try {
    const cached = await client.get<T>(key);
    if (cached) {
      return cached;
    }

    const freshData = await fetchFn();
    await client.set(key, freshData, { ex: ttlSeconds });
    return freshData;
  } catch (error) {
    logger.error(`Cache error for key ${key}`, error);
    return fetchFn();
  }
}

/**
 * Cache Keys Constants
 */
export const CacheKeys = {
  portalAgency: (subdomain: string) => `portal:agency:${subdomain}`,
  portalClient: (subdomain: string) => `portal:client:${subdomain}`,
  agencyBranding: (agencyId: string) => `agency:branding:${agencyId}`,
};

/**
 * Cache TTLs
 */
export const CacheTTL = {
  BRANDING: 3600, // 1 hour for branding/subdomain lookups
  PORTAL_DATA: 600, // 10 minutes for client portal data
};
